import { useCallback, useMemo, useState } from 'react'
import { message, type MenuProps } from 'antd'
import dayjs from 'dayjs'
import { CalendarOutlined } from '@ant-design/icons'
import { ITransaction } from './transactionTypes'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { useAddPaymentMutation } from '@common/api/paymentApi/payment.api'
import { getPaymentProviderAndReciever } from '@utils/helpers'
import { getResolvedDescription } from './bankHelper'
import { Operations } from '@utils/constants'

interface UseQuickPaymentProps {
  transaction: ITransaction
  domain: IExtendedDomain
  selectedCompany: string | null
  relatedCompanies: any[]
}

export const useQuickPayment = ({
  transaction,
  domain,
  selectedCompany,
  relatedCompanies,
}: UseQuickPaymentProps) => {
  const [loading, setLoading] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [addPayment] = useAddPaymentMutation()

  const { data: servicesData, isLoading: isServicesLoading } = useGetAllServicesQuery({
    domainId: domain._id,
  })

  const transactionPayload = useMemo(() => ({
    AUT_CNTR_ACC: transaction.AUT_CNTR_ACC,
    AUT_CNTR_NAM: transaction.AUT_CNTR_NAM,
    AUT_CNTR_MFO: transaction.AUT_CNTR_MFO,
    OSND: transaction.OSND,
    Description: getResolvedDescription(transaction, relatedCompanies),
    TECHNICAL_TRANSACTION_ID: transaction.TECHNICAL_TRANSACTION_ID,
  }), [transaction, relatedCompanies])

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
        generalSum: parseFloat(transaction.SUM as string),
        description: getResolvedDescription(transaction, relatedCompanies),
        type: Operations.Credit,
        provider,
        reciever: reciever,
        transaction: transactionPayload,
      }).unwrap()

      message.success(`Рахунок за ${dayjs(service.date).format('MMMM YYYY')} створено!`)
    } catch (error) {
      console.error('Quick send error:', error)
      message.error('Помилка при створенні рахунку')
    } finally {
      setLoading(false)
    }
  }, [selectedCompany, relatedCompanies, domain, addPayment, transaction, transactionPayload])

  const dropdownItems: MenuProps['items'] = useMemo(() => {
    if (!servicesData?.data) return []
    return servicesData.data.map((service) => ({
      key: service._id,
      label: dayjs(service.date).format('MMMM YYYY'),
      icon: <CalendarOutlined />,
      onClick: () => handleQuickSend(service),
    }))
  }, [servicesData, handleQuickSend])

  return {
    loading,
    isServicesLoading,
    selectedService,
    setSelectedService,
    transactionPayload,
    dropdownItems,
    handleQuickSend
  }
}