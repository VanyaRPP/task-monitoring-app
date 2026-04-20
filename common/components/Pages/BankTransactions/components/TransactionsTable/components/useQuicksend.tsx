import { useCallback, useMemo, useState } from 'react'
import { message } from 'antd'
import { ITransaction } from './transactionTypes'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { useAddPaymentMutation } from '@common/api/paymentApi/payment.api'
import { getPaymentProviderAndReciever } from '@utils/helpers'
import { getResolvedDescription } from './bankHelper'
import { Operations } from '@utils/constants'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { getRollingServices, formatDate, toDate } from './datesHelper'

const ROLLING_MONTH_COUNT = 12

interface UseQuickSendProps {
  transaction: ITransaction
  domain: IExtendedDomain
  selectedCompanyId: string | null
  relatedCompanies: IRealestate[]
}

export const useQuickSend = ({
  transaction,
  domain,
  selectedCompanyId,
  relatedCompanies,
}: UseQuickSendProps) => {
  const [loading, setLoading] = useState(false)
  const [addPayment] = useAddPaymentMutation()

  const company = useMemo(
    () => relatedCompanies.find((c) => c._id === selectedCompanyId),
    [relatedCompanies, selectedCompanyId]
  )

  const streetId = useMemo(() => {
    return typeof company?.street === 'object'
      ? (company.street as any)?._id
      : company?.street
  }, [company])

  const { data: servicesData, isLoading: isServicesLoading } = useGetAllServicesQuery({
    domainId: domain._id,
    streetId,
  }, { skip: !domain._id || !streetId })

  const services = useMemo(() => {
    return getRollingServices(servicesData?.data || [], ROLLING_MONTH_COUNT)
  }, [servicesData])

  const transactionPayload = useMemo(() => ({
    AUT_CNTR_ACC: transaction.AUT_CNTR_ACC,
    AUT_CNTR_NAM: transaction.AUT_CNTR_NAM,
    AUT_CNTR_MFO: transaction.AUT_CNTR_MFO,
    OSND: transaction.OSND,
    Description: getResolvedDescription(transaction, relatedCompanies),
    TECHNICAL_TRANSACTION_ID: transaction.TECHNICAL_TRANSACTION_ID,
  }), [transaction, relatedCompanies])

  const handleQuickSend = useCallback(async (service: any) => {
    if (!selectedCompanyId) {
      message.warning('Будь ласка, оберіть компанію')
      return
    }
    setLoading(true)

    try {
      const company = relatedCompanies.find((c) => c._id === selectedCompanyId)
      if (!company) throw new Error('Company not found')

      const { provider, reciever } = getPaymentProviderAndReciever({
        company,
        domain,
        operation: Operations.Credit,
      })

      await addPayment({
        invoiceCreationDate: toDate(service.date),
        monthService: service._id,
        domain: domain._id,
        company: selectedCompanyId,
        street: typeof company.street === 'object' ? (company.street as any)?._id : company.street,
        invoiceNumber: 0,
        invoice: [],
        generalSum: parseFloat(transaction.SUM as string),
        description: getResolvedDescription(transaction, relatedCompanies),
        type: Operations.Credit,
        provider,
        reciever: reciever,
        transaction: transactionPayload,
      }).unwrap()

      message.success(`Рахунок за ${formatDate(service.date, 'MMMM YYYY')} успішно створено!`)
    } catch (error) {
      console.error('Quick send error:', error)
      message.error('Помилка при створенні рахунку')
    } finally {
      setLoading(false)
    }
  }, [selectedCompanyId, relatedCompanies, domain, addPayment, transaction, transactionPayload])

  return {
    loading,
    isServicesLoading,
    services,
    handleQuickSend,
  }
}