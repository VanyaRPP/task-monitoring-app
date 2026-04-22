import { useCallback, useState } from 'react'
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
import { getStreetId, buildTransactionPayload } from './quickSendHelpers'

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

  const company = relatedCompanies.find((c) => c._id === selectedCompanyId)
  const streetId = getStreetId(company)

  const { data: servicesData, isLoading: isServicesLoading } = useGetAllServicesQuery(
    { domainId: domain._id, streetId },
    { skip: !domain._id || !streetId }
  )

  const services = getRollingServices(servicesData?.data || [], ROLLING_MONTH_COUNT)

  const handleQuickSend = useCallback(
    async (service: any) => {
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
          street: getStreetId(company) ?? '',
          invoiceNumber: 0,
          invoice: [],
          generalSum: parseFloat(transaction.SUM as string),
          description: getResolvedDescription(transaction, relatedCompanies),
          type: Operations.Credit,
          provider,
          reciever,
          transaction: buildTransactionPayload(transaction, relatedCompanies),
        }).unwrap()

        message.success(`Рахунок за ${formatDate(service.date, 'MMMM YYYY')} успішно створено!`)
      } catch (error) {
        console.error('Quick send error:', error)
        message.error('Помилка при створенні рахунку')
      } finally {
        setLoading(false)
      }
    },
    [selectedCompanyId, relatedCompanies, domain, addPayment, transaction]
  )

  return {
    loading,
    isServicesLoading,
    services,
    handleQuickSend,
  }
}
