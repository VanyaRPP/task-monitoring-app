import { useCallback, useState, useMemo } from 'react'
import { message } from 'antd'
import { ITransaction } from './transactionTypes'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { useGetAllServicesQuery, useAddServiceMutation } from '@common/api/serviceApi/service.api'
import { useAddPaymentMutation, useGetPaymentNumberQuery } from '@common/api/paymentApi/payment.api'
import { getPaymentProviderAndReciever } from '@utils/helpers'
import { getResolvedDescription } from './bankHelper'
import { Operations } from '@utils/constants'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { formatDate, parseDate, toDate } from './datesHelper'
import { getStreetId, buildTransactionPayload } from './quickSendHelpers'
import dayjs from 'dayjs'
import {
  buildMonthServicePlaceholder,
  isMonthServicePlaceholder,
  parseMonthServicePlaceholder,
} from '@common/components/Forms/AddPaymentForm/month-service-placeholder'

const ROLLING_MONTH_COUNT = 12

interface UseQuickSendProps {
  transaction: ITransaction
  domain: IExtendedDomain
  selectedCompanyId: string | null
  relatedCompanies: IRealestate[]
  onSuccess?: () => void
}

export const useQuickSend = ({
  transaction,
  domain,
  selectedCompanyId,
  relatedCompanies,
  onSuccess,
}: UseQuickSendProps) => {
  const [loading, setLoading] = useState(false)
  const [addPayment] = useAddPaymentMutation()
  const [addService] = useAddServiceMutation()
  const { data: nextInvoiceNumber = 1 } = useGetPaymentNumberQuery(undefined)

  const company = relatedCompanies.find((c) => c._id === selectedCompanyId)
  const streetId = getStreetId(company)

  const resolveMonthServiceId = useCallback(
    async (rawMonthServiceId: string) => {
      if (!isMonthServicePlaceholder(rawMonthServiceId)) {
        return rawMonthServiceId
      }

      const monthStart = parseMonthServicePlaceholder(rawMonthServiceId)
      const created = await addService({
        domain: domain._id,
        street: streetId ?? '',
        date: monthStart.startOf('month').toDate(),
        rentPrice: 0,
        electricityPrice: 0,
        waterPrice: 0,
        waterPriceTotal: 0,
        description: '',
        customServices: [],
      }).unwrap()

      return created.data._id
    },
    [addService, domain._id, streetId]
  )

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

        const monthServiceId = await resolveMonthServiceId(service._id)
        const invoiceCreationDate = transaction.DAT_OD
          ? toDate(parseDate(transaction.DAT_OD, 'DD.MM.YYYY'))
          : toDate(service.date)

        await addPayment({
          invoiceCreationDate,
          monthService: monthServiceId,
          domain: domain._id,
          company: selectedCompanyId,
          street: getStreetId(company) ?? '',
          invoiceNumber: nextInvoiceNumber,
          invoice: [],
          generalSum: parseFloat(transaction.SUM as string),
          description: getResolvedDescription(transaction, relatedCompanies),
          type: Operations.Credit,
          provider,
          reciever,
          transaction: buildTransactionPayload(transaction, relatedCompanies),
        }).unwrap()

        message.success(`Рахунок за ${formatDate(service.date, 'MMMM YYYY')} успішно створено!`)

        onSuccess?.()

        const channel = new BroadcastChannel('payments_sync_channel')
        channel.postMessage('PAYMENT_CREATED')
        setTimeout(() => channel.close(), 100)
      } catch (error) {
        console.error('Quick send error:', error)
        message.error('Помилка при створенні рахунку')
      } finally {
        setLoading(false)
      }
    },
    [selectedCompanyId, relatedCompanies, domain, addPayment, transaction, company, onSuccess, nextInvoiceNumber, resolveMonthServiceId]
  )

  return {
    loading,
    isServicesLoading,
    services,
    handleQuickSend,
  }
}
