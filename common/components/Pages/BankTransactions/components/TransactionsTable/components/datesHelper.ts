import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/uk'
import { buildMonthServicePlaceholder } from '@common/components/Forms/AddPaymentForm/month-service-placeholder'

dayjs.extend(customParseFormat)
dayjs.locale('uk')

export const getRollingServices = (allServices: any[], rollingMonthCount: number) => {
  const byMonthKey = new Map<string, any>()

  for (const svc of allServices) {
    const key = dayjs(svc.date).startOf('month').format('YYYY-MM')
    byMonthKey.set(key, svc)
  }
  for (let i = 0; i < rollingMonthCount; i++) {
    const m = dayjs().subtract(i, 'month').startOf('month')
    const key = m.format('YYYY-MM')
    if (!byMonthKey.has(key)) {
      byMonthKey.set(key, { _id: buildMonthServicePlaceholder(m), date: m.toISOString() })
    }
  }
  return [...byMonthKey.values()].sort((a, b) => 
    dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
  )
}

export const formatDate = (date: string | Date | dayjs.Dayjs, format: string) => {
  return dayjs(date).format(format)
}

export const toDate = (date: string | Date | dayjs.Dayjs) => {
  return dayjs(date).toDate()
}

export const parseDate = (dateStr: string, format: string) => {
  return dayjs(dateStr, format)
}