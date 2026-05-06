import { Badge, Button, Select, Space, Dropdown, message, type MenuProps } from 'antd'
import React, { FC, useEffect, useMemo, useState } from 'react'
import { ITransaction } from './transactionTypes'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import AddPaymentModal from '@components/AddPaymentModal'
import { SendOutlined, DownOutlined, CalendarOutlined } from '@ant-design/icons'
import { matchCompany, MatchType, getResolvedDescription } from './bankHelper'
import { formatDate, parseDate } from './datesHelper'
import { useGetAllRealEstateQuery, useEditRealEstateMutation } from '@common/api/realestateApi/realestate.api'
import { useQuickSend } from './useQuicksend'
import { buildTransactionPayload } from './quickSendHelpers'
import styles from './style.module.scss'

interface TransactionDrawerProps {
  transaction: ITransaction
  domain: IExtendedDomain
  refetchTransactions?: () => void
}

const TransactionDrawer: FC<TransactionDrawerProps> = ({
  transaction,
  domain,
  refetchTransactions
}) => {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [isAccountMatched, setIsAccountMatched] = useState(false)
  const [loading, setLoading] = useState(false)

  const transactionAmount = parseFloat(transaction.SUM as string)

  const { data: realEstatesData } = useGetAllRealEstateQuery({ domainId: domain._id })
  const [editRealEstate] = useEditRealEstateMutation()

  const relatedCompanies = useMemo(
    () => realEstatesData?.data || [],
    [realEstatesData]
  )

  const { handleQuickSend, services, loading: quickSendLoading } = useQuickSend({
    transaction,
    domain,
    selectedCompanyId: selectedCompany,
    relatedCompanies,
    onSuccess: refetchTransactions,
  })

  useEffect(() => {
    if (!relatedCompanies.length) return

    const { companyId, matchedBy } = matchCompany(
      transaction,
      relatedCompanies
    )

    setSelectedCompany(companyId)
    setIsAccountMatched(matchedBy === MatchType.ACCOUNT)
  }, [transaction, relatedCompanies])

  const handleCompanyChange = (value: string) => {
    setSelectedCompany(value)
    setIsAccountMatched(false)
  }

  const saveAccountToCompany = async (companyId: string) => {
    if (!transaction.AUT_CNTR_ACC) return
    if (transaction.AUT_CNTR_NAM?.includes('Транз')) return
    await editRealEstate({ _id: companyId, account: transaction.AUT_CNTR_ACC })
  }

  const showModal = () => setModalVisible(true)

  const closeModal = async (success?: boolean) => {
    setModalVisible(false)
    if (success === true) {
      message.success('Рахунок успішно створено!')
      if (selectedCompany && !isAccountMatched) {
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

  const transactionPayload = buildTransactionPayload(transaction, relatedCompanies)

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
        <Space.Compact style={{ width: '100%' }}>
          <Select
            placeholder="Select a related company"
            onChange={handleCompanyChange}
            value={selectedCompany ?? undefined}
            style={{ width: 'calc(100% - 80px)' }}
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
                menu={{ items: quickSendMenuItems }}
                trigger={['hover', 'click']}
                disabled={!selectedCompany || services.length === 0}
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
                  className: styles.monthsDropdown
                }}
                trigger={['hover', 'click']}
                disabled={!selectedCompany || services.length === 0}
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
      </Badge.Ribbon>
      {modalVisible && (
        <AddPaymentModal
          closeModal={closeModal}
          paymentData={{
            ...relatedCompanies.find((company) => company._id === selectedCompany),
            generalSum: transactionAmount,
            description: getResolvedDescription(transaction, relatedCompanies),
            invoiceCreationDate: parseDate(transaction.DAT_OD, 'DD.MM.YYYY'),
            company: selectedCompany,
            domain: domain,
            transaction: transactionPayload,
          }}
          paymentActions={{
            edit: false,
            preview: false,
          }}
        />
      )}
    </>
  )
}

export default TransactionDrawer