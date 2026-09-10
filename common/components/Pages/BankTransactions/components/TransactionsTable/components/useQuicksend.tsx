import { useCallback, useState, useMemo } from 'react'
import { message } from 'antd'
import { ITransaction } from './transactionTypes'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import {
  useGetAllServicesQuery,
  useAddServiceMutation,
} from '@common/api/serviceApi/service.api'
import {
  useAddPaymentMutation,
  useGetPaymentNumberQuery,
} from '@common/api/paymentApi/payment.api'
import { useCreateProfitMutation } from '@common/api/profitsApi/profits.api'
import { getPaymentProviderAndReciever } from '@utils/helpers'
import { getResolvedDescription } from './bankHelper'
import { Operations, Currency } from '@utils/constants'
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
  selectedCategory?: string | null
  onSuccess?: () => void
}

export const useQuickSend = ({
  transaction,
  domain,
  selectedCompanyId,
  relatedCompanies,
  selectedCategory,
  onSuccess,
}: UseQuickSendProps) => {
  const [loading, setLoading] = useState(false)
  const [addPayment] = useAddPaymentMutation()
  const [createProfit] = useCreateProfitMutation()
  const [addService] = useAddServiceMutation()
  const { data: nextInvoiceNumber = 1 } = useGetPaymentNumberQuery(undefined)
  const isDebit = transaction.TRANTYPE === 'D'

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
        // street is optional; sending '' fails the ObjectId cast on the backend,
        // so omit it entirely when the company has no street.
        ...(streetId ? { street: streetId } : {}),
        // noon UTC on the 1st so no timezone offset can push the service into
        // the neighbouring month (matches AddServiceModal's normalisation).
        date: new Date(
          Date.UTC(monthStart.year(), monthStart.month(), 1, 12, 0, 0)
        ),
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

  const { data: servicesData, isLoading: isServicesLoading } =
    useGetAllServicesQuery(
      { domainId: domain._id, ...(streetId ? { streetId } : {}) },
      { skip: !domain._id || (!isDebit && !streetId) }
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

    return [...byMonthKey.values()].sort(
      (a, b) => b.date.valueOf() - a.date.valueOf()
    )
  }, [servicesData])

  const handleQuickSend = useCallback(
    async (service: { _id: string; date: dayjs.Dayjs }) => {
      setLoading(true)

      try {
        if (isDebit) {
          const category = selectedCategory?.trim()

          if (!category) {
            message.warning('Будь ласка, оберіть категорію')
            return
          }

          await createProfit({
            domain: domain._id,
            date: transaction.DAT_OD
              ? dayjs(parseDate(transaction.DAT_OD, 'DD.MM.YYYY')).toISOString()
              : service.date.toISOString(),
            amount: parseFloat(transaction.SUM as string),
            description: getResolvedDescription(transaction, relatedCompanies),
            type: Operations.Debit,
            categories: [category],
            periodMonth: service.date.format('YYYY-MM'),
            currency: transaction.CCY || Currency.UAH,
          }).unwrap()

          message.success(
            `Витрату за ${formatDate(
              service.date,
              'MMMM YYYY'
            )} успішно створено!`
          )

          onSuccess?.()
          return
        }

        if (!selectedCompanyId) {
          message.warning('Будь ласка, оберіть компанію')
          return
        }

        if (!company) throw new Error('Company not found')

        // getPaymentProviderAndReciever takes the company directly (same as the
        // standard AddPaymentModal flow). Passing a { company, domain } wrapper
        // left companyName/adminEmails undefined -> an empty reciever on the
        // saved invoice.
        const { provider, reciever } = getPaymentProviderAndReciever(company)

        const monthServiceId = await resolveMonthServiceId(service._id)
        const invoiceCreationDate = transaction.DAT_OD
          ? toDate(parseDate(transaction.DAT_OD, 'DD.MM.YYYY'))
          : toDate(service.date)

        await addPayment({
          invoiceCreationDate,
          monthService: monthServiceId,
          domain: domain._id,
          company: selectedCompanyId,
          // street is optional; sending '' fails the ObjectId cast on the
          // backend, so omit it when the company has no street.
          ...(streetId ? { street: streetId } : {}),
          invoiceNumber: nextInvoiceNumber,
          invoice: [],
          generalSum: parseFloat(transaction.SUM as string),
          description: getResolvedDescription(transaction, relatedCompanies),
          type: Operations.Credit,
          provider,
          reciever,
          transaction: buildTransactionPayload(transaction, relatedCompanies),
        }).unwrap()

        message.success(
          `Рахунок за ${formatDate(
            service.date,
            'MMMM YYYY'
          )} успішно створено!`
        )

        onSuccess?.()

        const channel = new BroadcastChannel('payments_sync_channel')
        channel.postMessage('PAYMENT_CREATED')
        setTimeout(() => channel.close(), 100)
      } catch (error) {
        console.error('Quick send error:', error)
        const serverMsg =
          (error as { data?: { message?: string; error?: string } })?.data
            ?.message ??
          (error as { data?: { message?: string; error?: string } })?.data
            ?.error ??
          (error as Error)?.message
        message.error(
          serverMsg
            ? `Помилка при створенні рахунку: ${serverMsg}`
            : isDebit
              ? 'Помилка при створенні витрати'
              : 'Помилка при створенні рахунку'
        )
      } finally {
        setLoading(false)
      }
    },
    [
      isDebit,
      selectedCategory,
      selectedCompanyId,
      relatedCompanies,
      domain,
      addPayment,
      transaction,
      company,
      onSuccess,
      createProfit,
      nextInvoiceNumber,
      resolveMonthServiceId,
      streetId,
    ]
  )

  return {
    loading,
    isServicesLoading,
    services,
    handleQuickSend,
  }
}
