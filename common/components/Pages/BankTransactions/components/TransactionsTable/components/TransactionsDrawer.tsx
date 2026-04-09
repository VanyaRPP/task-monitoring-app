import { Badge, Button, Select, Space, Dropdown, message, type MenuProps } from 'antd'
import React, { FC, useEffect, useMemo, useState, useCallback } from 'react'
import { ITransaction } from './transactionTypes' 
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import AddPaymentModal from '@components/AddPaymentModal'
import dayjs from 'dayjs'
import { DownOutlined, CalendarOutlined } from '@ant-design/icons'
import { matchCompany, getResolvedDescription } from './bankHelper'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { useAddPaymentMutation } from '@common/api/paymentApi/payment.api'
import { getPaymentProviderAndReciever } from '@utils/helpers'
import { Operations } from '@utils/constants'

interface TransactionDrawerProps {
  transaction: ITransaction
  domain: IExtendedDomain
}

const TransactionDrawer: FC<TransactionDrawerProps> = ({ transaction, domain }) => {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)

  const [addPayment] = useAddPaymentMutation()
  const transactionAmount = parseFloat(transaction.SUM as string)

  const { data: realEstatesData } = useGetAllRealEstateQuery({ domainId: domain._id })
  const { data: servicesData, isLoading: isServicesLoading } = useGetAllServicesQuery({ domainId: domain._id })

  const relatedCompanies = useMemo(() => realEstatesData?.data || [], [realEstatesData])

  const transactionPayload = useMemo(() => ({
    AUT_CNTR_ACC: transaction.AUT_CNTR_ACC,
    AUT_CNTR_NAM: transaction.AUT_CNTR_NAM,
    AUT_CNTR_MFO: transaction.AUT_CNTR_MFO,
    OSND: transaction.OSND,
    Description: getResolvedDescription(transaction, relatedCompanies),
    TECHNICAL_TRANSACTION_ID: transaction.TECHNICAL_TRANSACTION_ID,
  }), [transaction, relatedCompanies])

  useEffect(() => {
    if (!relatedCompanies.length) return
    const { companyId } = matchCompany(transaction, relatedCompanies)
    setSelectedCompany(companyId)
  }, [transaction, relatedCompanies])

  const handleQuickSend = useCallback(async (service: any) => {
    if (!selectedCompany) return
    setLoading(true)

    try {
      const company = relatedCompanies.find((c) => c._id === selectedCompany)
      const { provider, reciever } = getPaymentProviderAndReciever({
        company,
        domain,
        operation: Operations.Credit,
      })

      await addPayment({
        invoiceCreationDate: dayjs(service.date).toDate(),
        monthService: service._id,
        domain: domain._id,
        company: selectedCompany,
        street: typeof company.street === 'object' ? company.street._id : company.street,
        invoiceNumber: 0, 
        invoice: [], 
        generalSum: transactionAmount,
        description: getResolvedDescription(transaction, relatedCompanies),
        type: Operations.Credit,
        provider,
        reciever: reciever, 
        transaction: transactionPayload,
      }).unwrap()

      message.success(`Рахунок за ${dayjs(service.date).format('MMMM YYYY')} успішно створено!`)
    } catch (error) {
      console.error('Quick send error:', error)
      message.error('Помилка при створенні рахунку')
    } finally {
      setLoading(false)
    }
  }, [selectedCompany, relatedCompanies, domain, addPayment, transactionAmount, transactionPayload, transaction])

  const dropdownItems: MenuProps['items'] = useMemo(() => {
    if (!servicesData?.data) return []
    return servicesData.data.map((service) => ({
      key: service._id,
      label: dayjs(service.date).format('MMMM YYYY'),
      icon: <CalendarOutlined />,
      onClick: () => handleQuickSend(service),
    }))
  }, [servicesData, handleQuickSend])

  const showModal = () => {
    setSelectedService(null)
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setSelectedService(null)
    setLoading(false)
  }

  return (
    <>
      <Badge.Ribbon
        text="Платіж є"
        color="purple"
        style={{ top: '-50%', visibility: transaction.isMatchingPayment ? 'visible' : 'hidden' }}
      >
        <Space.Compact style={{ width: '100%' }}>
          <Select
            placeholder="Оберіть компанію"
            onChange={setSelectedCompany}
            value={selectedCompany ?? undefined}
            style={{ width: 'calc(100% - 120px)' }}
          >
            {relatedCompanies.map((c) => (
              <Select.Option key={c._id} value={c._id}>{c.companyName}</Select.Option>
            ))}
          </Select> 

          <Dropdown.Button
            type="primary"
            loading={loading || isServicesLoading}
            disabled={!selectedCompany}
            trigger={['hover']}
            menu={{ items: dropdownItems }}
            onClick={showModal}
            icon={<DownOutlined />}
            style={{ width: '120px' }}
          >
            Send
          </Dropdown.Button> 
        </Space.Compact>
      </Badge.Ribbon>

      {modalVisible && (
        <AddPaymentModal
          key={selectedService?._id || 'manual'}
          closeModal={closeModal}
          paymentData={{
            ...relatedCompanies.find((c) => c._id === selectedCompany),
            generalSum: transactionAmount,
            description: getResolvedDescription(transaction, relatedCompanies),
            invoiceCreationDate: selectedService 
              ? dayjs(selectedService.date).toDate() 
              : dayjs(transaction.DAT_OD, 'DD.MM.YYYY').toDate(),
            monthService: selectedService, 
            company: selectedCompany,
            domain: domain,
            transaction: transactionPayload,
            type: Operations.Credit,
          }}
          paymentActions={{ edit: false, preview: false }}
        />
      )}
    </>
  )
}

export default TransactionDrawer