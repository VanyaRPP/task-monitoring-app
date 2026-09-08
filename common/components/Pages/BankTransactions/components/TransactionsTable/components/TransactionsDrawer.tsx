import {
  Badge,
  Button,
  Select,
  Space,
  Dropdown,
  message,
  type MenuProps,
} from 'antd'
import React, { FC, useEffect, useMemo, useState } from 'react'
import { ITransaction } from './transactionTypes'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import AddPaymentModal from '@components/AddPaymentModal'
import AddCostModal from '@components/AddCostModal'
import {
  SendOutlined,
  DownOutlined,
  CalendarOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { matchCompany, MatchType, getResolvedDescription } from './bankHelper'
import { formatDate, parseDate } from './datesHelper'
import {
  useGetAllRealEstateQuery,
  useEditRealEstateMutation,
} from '@common/api/realestateApi/realestate.api'
import { useQuickSend } from './useQuicksend'
import { Operations, DEFAULT_CATEGORIES, OTHER_KEY } from '@utils/constants'
import {
  buildTransactionPayload,
  buildCompanyIdentifierPatch,
} from './quickSendHelpers'
import dayjs from 'dayjs'
import styles from './style.module.scss'

interface TransactionDrawerProps {
  transaction: ITransaction
  domain: IExtendedDomain
  refetchTransactions?: () => void
}

const DEFAULT_CATEGORY = '__default__'

const TransactionDrawer: FC<TransactionDrawerProps> = ({
  transaction,
  domain,
  refetchTransactions,
}) => {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categorySearch, setCategorySearch] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [isAccountMatched, setIsAccountMatched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isCustomCategory, setIsCustomCategory] = useState(false)

  const transactionAmount = parseFloat(transaction.SUM as string)

  const isDebit = transaction.TRANTYPE === 'D'

  const { data: realEstatesData } = useGetAllRealEstateQuery({
    domainId: domain._id,
  })
  const [editRealEstate] = useEditRealEstateMutation()

  const relatedCompanies = useMemo(
    () => realEstatesData?.data || [],
    [realEstatesData]
  )

  const {
    handleQuickSend,
    services,
    loading: quickSendLoading,
  } = useQuickSend({
    transaction,
    domain,
    selectedCompanyId: selectedCompany,
    relatedCompanies,
    selectedCategory,
    onSuccess: refetchTransactions,
  })

  useEffect(() => {
    if (!relatedCompanies.length) return

    const { companyId, matchedBy } = matchCompany(transaction, relatedCompanies)

    setSelectedCompany(companyId)
    setIsAccountMatched(matchedBy === MatchType.ACCOUNT)
  }, [transaction, relatedCompanies])

  const handleCompanyChange = (value: string) => {
    setSelectedCompany(value)
    setIsAccountMatched(false)
  }

  const handleCategoryChange = (value: string) => {
    if (value === OTHER_KEY) {
      setSelectedCategory('')
      setCategorySearch('')
      setIsCustomCategory(true)
      return
    }
    if (value === DEFAULT_CATEGORY) {
      setSelectedCategory(null)
      setCategorySearch('')
      setIsCustomCategory(false)
      return
    }
    setSelectedCategory(value)
    setCategorySearch('')
    setIsCustomCategory(false)
  }

  const handleCategorySearch = (value: string) => setCategorySearch(value)

  const handleCategoryClear = () => {
    setSelectedCategory(null)
    setCategorySearch('')
    setIsCustomCategory(false)
  }

  const customCategory = categorySearch.trim()

  const filterCategoryOption = (
    input: string,
    option?: { value?: string | number }
  ) =>
    String(option?.value ?? '')
      .toLowerCase()
      .includes(input.trim().toLowerCase())

  const saveAccountToCompany = async (companyId: string) => {
    const company = relatedCompanies.find((c) => c._id === companyId)
    const patch = buildCompanyIdentifierPatch(transaction, company, companyId, {
      accountAlreadyMatched: isAccountMatched,
    })
    if (patch) await editRealEstate(patch)
  }

  const showModal = () => setModalVisible(true)

  const closeModal = async (success?: boolean) => {
    setModalVisible(false)
    if (success === true) {
      message.success('Рахунок успішно створено!')
      if (selectedCompany) {
        await saveAccountToCompany(selectedCompany)
      }
      refetchTransactions?.()
    }
    setLoading(false)
  }

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'credit',
      label: 'Швидке створення',
      onClick: () => {
        setLoading(true)
        showModal()
      },
    },
    {
      key: 'standard',
      label: 'Ручне створення',
      onClick: showModal,
    },
  ]

  const transactionPayload = buildTransactionPayload(
    transaction,
    relatedCompanies
  )

  const quickSendMenuItems: MenuProps['items'] = services.map((service) => ({
    key: service._id,
    label: formatDate(service.date, 'MMMM YYYY'),
    icon: <CalendarOutlined />,
    onClick: () => handleQuickSend(service),
  }))

  return (
    <>
      <Badge.Ribbon
        text="Платіж є"
        color="RoyalBlue"
        style={{
          top: '-50%',
          visibility: transaction.isMatchingPayment ? 'visible' : 'hidden',
        }}
      >
        {isDebit ? (
          <Space.Compact style={{ width: '100%' }}>
            <Select
              key={isCustomCategory ? 'custom-category' : 'default-category'}
              placeholder={
                isCustomCategory ? 'Enter your category' : 'Select a category'
              }
              showSearch
              value={selectedCategory || undefined}
              onChange={handleCategoryChange}
              onSearch={handleCategorySearch}
              onClear={handleCategoryClear}
              filterOption={isCustomCategory ? false : filterCategoryOption}
              allowClear
              style={{ width: 'calc(100% - 80px)', maxWidth: 300 }}
            >
              {isCustomCategory ? (
                <>
                  {customCategory && (
                    <Select.Option value={customCategory}>
                      <PlusOutlined /> {customCategory}
                    </Select.Option>
                  )}

                  <Select.Option value={DEFAULT_CATEGORY}>
                    Back to the selection
                  </Select.Option>
                </>
              ) : (
                <>
                  {DEFAULT_CATEGORIES.map((category) => (
                    <Select.Option key={category} value={category}>
                      {category}
                    </Select.Option>
                  ))}

                  {customCategory &&
                    !DEFAULT_CATEGORIES.some((category) =>
                      category
                        .toLowerCase()
                        .includes(customCategory.toLowerCase())
                    ) && (
                      <Select.Option value={customCategory}>
                        <PlusOutlined /> {customCategory}
                      </Select.Option>
                    )}

                  <Select.Option value={OTHER_KEY}>Інше</Select.Option>
                </>
              )}
            </Select>
            <Button
              type="primary"
              onClick={showModal}
              disabled={!selectedCategory?.trim()}
              loading={loading}
              icon={<SendOutlined style={{ fontSize: '25px' }} />}
            >
              Send
            </Button>
            <Dropdown
              menu={{
                items: quickSendMenuItems,
                className: styles.monthsDropdown,
              }}
              trigger={['click']}
              disabled={
                !selectedCategory?.trim() ||
                services.length === 0 ||
                quickSendLoading
              }
            >
              <Button
                type="primary"
                icon={<DownOutlined />}
                loading={quickSendLoading}
              />
            </Dropdown>
          </Space.Compact>
        ) : (
          <Space.Compact style={{ width: '100%' }}>
            <Select
              placeholder="Select a related company"
              onChange={handleCompanyChange}
              value={selectedCompany ?? undefined}
              style={{ width: 'calc(100% - 80px)', maxWidth: 300 }}
            >
              {relatedCompanies.map((company) => (
                <Select.Option key={company._id} value={company._id}>
                  {company.companyName}
                </Select.Option>
              ))}
            </Select>
            {isAccountMatched ? (
              <>
                <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
                  <Button
                    type="primary"
                    loading={loading || quickSendLoading}
                    icon={<DownOutlined style={{ fontSize: '12px' }} />}
                    iconPosition="end"
                  >
                    Send
                  </Button>
                </Dropdown>
                <Dropdown
                  menu={{
                    items: quickSendMenuItems,
                    className: styles.monthsDropdown,
                  }}
                  trigger={['click']}
                  disabled={
                    !selectedCompany ||
                    services.length === 0 ||
                    quickSendLoading
                  }
                >
                  <Button
                    type="primary"
                    icon={<DownOutlined />}
                    loading={quickSendLoading}
                  />
                </Dropdown>
              </>
            ) : (
              <>
                <Button
                  type="primary"
                  onClick={showModal}
                  disabled={!selectedCompany}
                  loading={loading || quickSendLoading}
                  icon={<SendOutlined style={{ fontSize: '25px' }} />}
                >
                  Send
                </Button>
                <Dropdown
                  menu={{
                    items: quickSendMenuItems,
                    className: styles.monthsDropdown,
                  }}
                  trigger={['click']}
                  disabled={
                    !selectedCompany ||
                    services.length === 0 ||
                    quickSendLoading
                  }
                >
                  <Button
                    type="primary"
                    icon={<DownOutlined />}
                    loading={quickSendLoading}
                  />
                </Dropdown>
              </>
            )}
          </Space.Compact>
        )}
      </Badge.Ribbon>

      {modalVisible &&
        (isDebit ? (
          <AddCostModal
            closeModal={closeModal}
            activeDomain={domain._id}
            transactionData={{
              amount: transactionAmount,
              date: parseDate(transaction.DAT_OD, 'DD.MM.YYYY').toDate(),
              periodMonth: dayjs(),
              description: getResolvedDescription(
                transaction,
                relatedCompanies
              ),
              currency: transaction.CCY,
              category: selectedCategory ?? undefined,
            }}
          />
        ) : (
          <AddPaymentModal
            closeModal={closeModal}
            paymentData={{
              ...relatedCompanies.find(
                (company) => company._id === selectedCompany
              ),
              generalSum: transactionAmount,
              description: getResolvedDescription(
                transaction,
                relatedCompanies
              ),
              invoiceCreationDate: parseDate(transaction.DAT_OD, 'DD.MM.YYYY'),
              company: selectedCompany,
              domain: domain,
              transaction: transactionPayload,
              type: Operations.Credit,
            }}
            paymentActions={{
              edit: false,
              preview: false,
            }}
          />
        ))}
    </>
  )
}

export default TransactionDrawer
