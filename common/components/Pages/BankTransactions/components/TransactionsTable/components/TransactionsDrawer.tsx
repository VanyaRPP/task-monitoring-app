import {
  Badge,
  Tooltip,
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
import { SendOutlined, DownOutlined, CalendarOutlined } from '@ant-design/icons'
import { matchCompany, MatchType, getResolvedDescription } from './bankHelper'
import { formatDate, parseDate } from './datesHelper'
import {
  useGetAllRealEstateQuery,
  useEditRealEstateMutation,
} from '@common/api/realestateApi/realestate.api'
import { useQuickSend } from './useQuicksend'
import { Operations } from '@utils/constants'
import {
  buildTransactionPayload,
  buildCompanyIdentifierPatch,
} from './quickSendHelpers'
import styles from './style.module.scss'

interface TransactionDrawerProps {
  transaction: ITransaction
  domain: IExtendedDomain
  refetchTransactions?: () => void
}

const TransactionDrawer: FC<TransactionDrawerProps> = ({
  transaction,
  domain,
  refetchTransactions,
}) => {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [isAccountMatched, setIsAccountMatched] = useState(false)
  const [loading, setLoading] = useState(false)

  const transactionAmount = parseFloat(transaction.SUM as string)

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
  const quickSendMenuItems = services.map((service) => {
    // 1. Шукаємо компанію за її _id, вказуючи тип (c: any)
    const currentCompany = relatedCompanies?.find(
      (c: any) => c?._id === service?._id || c?.id === service?._id
    ) as any

    // 2. Перевіряємо статус архіву за точним полем `archived`
    const isArchived = !currentCompany || currentCompany?.archived === true

    // 3. Формуємо звичайний текст дати послуги
    const dateText = formatDate(service.date, 'MMMM YYYY')

    // 4. Якщо архівна — показуємо слово "Архівована" з підказкою Tooltip
    const itemLabel = isArchived ? (
      <Tooltip title={currentCompany?.name || 'Назва компанії в архіві'}>
        <span style={{ color: '#d4380d', fontWeight: 'bold' }}>Архівована</span>
      </Tooltip>
    ) : (
      dateText
    )

    return {
      key: service._id,
      label: itemLabel as any, 
      icon: <CalendarOutlined />,
      onClick: () => handleQuickSend(service),
    }
  }) as any


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
         {(() => {
  // Регулярний вираз для перевірки, чи є значення сирим ідентифікатором (ID)
  // Зазвичай ID в MongoDB — це 24-значний hex-рядок
  const isIdSelected = typeof selectedCompany === 'string' && /^[0-9a-fA-F]{24}$/.test(selectedCompany);

  // Шукаємо компанію в списку за її ідентифікатором
  const foundCompany = relatedCompanies.find(c => c._id === selectedCompany);

  // Якщо замість імені пишеться ID, то при наведенні показуємо її назву, інакше — нічого
  const tooltipTitle = isIdSelected && foundCompany ? foundCompany.companyName : undefined;

  return (
    <div 
      title={tooltipTitle} 
      style={{ display: 'inline-block', width: 'calc(100% - 80px)', maxWidth: 300 }}
    >
      <Select
        placeholder="Select a related company"
        onChange={handleCompanyChange}
        value={selectedCompany ?? undefined}
        style={{ width: '100%' }}
        optionLabelProp="label"
        title={tooltipTitle} // Дублюємо title для надійності в Ant Design
      >
        {relatedCompanies.map((company) => {
          // Якщо поточна опція відповідає вибраному ID, її назва в селекторі буде "Архівована"
          const isThisCompanyArchived = company._id === selectedCompany && isIdSelected;
          const labelText = isThisCompanyArchived ? 'Архівована' : company.companyName;

          return (
            <Select.Option 
              key={company._id} 
              value={company._id}
              label={labelText} // <--- Саме це значення запишеться в селектор замість ID
            >
              <span style={{ color: isIdSelected && company._id === selectedCompany ? '#d97706' : 'inherit' }}>
                {company.companyName}
              </span>
            </Select.Option>
          );
        })}
      </Select>
    </div>
  );
})()}

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
                  className: styles.monthsDropdown,
                }}
                trigger={['click']}
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
            ...relatedCompanies.find(
              (company) => company._id === selectedCompany
            ),
            generalSum: transactionAmount,
            description: getResolvedDescription(transaction, relatedCompanies),
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
      )}
    </>
  )
}

export default TransactionDrawer
