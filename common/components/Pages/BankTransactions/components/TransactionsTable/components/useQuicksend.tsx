import { useCallback, useState, useMemo } from 'react'
import { message } from 'antd'
import { ITransaction } from './transactionTypes'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { useAddPaymentMutation } from '@common/api/paymentApi/payment.api'
import { getPaymentProviderAndReciever } from '@utils/helpers'
import { getResolvedDescription } from './bankHelper'
import { Operations } from '@utils/constants'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { formatDate, toDate } from './datesHelper'
import { getStreetId, buildTransactionPayload } from './quickSendHelpers'
import dayjs from 'dayjs'
import { buildMonthServicePlaceholder } from '@common/components/Forms/AddPaymentForm/month-service-placeholder'

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

  const services = useMemo(() => {
    const fetchedServices = servicesData?.data || []
    const byMonthKey = new Map<string, { _id: string; date: dayjs.Dayjs }>()

    for (const svc of fetchedServices) {
      const m = dayjs(svc.date)
      const key = m.startOf('month').format('YYYY-MM')
      byMonthKey.set(key, { _id: svc._id, date: m })
    }

    for (let i = 0; i < ROLLING_MONTH_COUNT; i++) {
      const m = dayjs().subtract(i, 'month').startOf('month')
      const key = m.format('YYYY-MM')
      if (!byMonthKey.has(key)) {
        byMonthKey.set(key, {
          _id: buildMonthServicePlaceholder(m),
          date: m,
        })
      }
    }

    return [...byMonthKey.values()].sort((a, b) => b.date.valueOf() - a.date.valueOf())
  }, [servicesData])

  const handleQuickSend = useCallback(
    async (service: any) => {
      if (!selectedCompanyId) {
        message.warning('Будь ласка, оберіть компанію')
        return
      }
      setLoading(true)

      try {
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
    [selectedCompanyId, relatedCompanies, domain, addPayment, transaction, company]
  )

  return {
    loading,
    isServicesLoading,
    services,
    handleQuickSend,
  }
}
