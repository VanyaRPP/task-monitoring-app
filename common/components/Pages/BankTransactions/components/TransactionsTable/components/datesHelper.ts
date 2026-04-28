import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/uk'
import { buildMonthServicePlaceholder } from '@common/components/Forms/AddPaymentForm/month-service-placeholder'

dayjs.extend(customParseFormat)
dayjs.locale('uk')

export const getRollingServices = (allServices: any[], rollingMonthCount: number) => {
  const byMonthKey = new Map<string, any>()

  let earliestDate = dayjs().subtract(rollingMonthCount, 'month').startOf('month')

  for (const svc of allServices) {
    const svcDate = dayjs(svc.date).startOf('month')
    const key = svcDate.format('YYYY-MM')
    byMonthKey.set(key, svc)

    if (svcDate.isBefore(earliestDate)) {
      earliestDate = svcDate
    }
  }

  let current = dayjs().startOf('month')
  
  while (current.isAfter(earliestDate) || current.isSame(earliestDate, 'month')) {
    const key = current.format('YYYY-MM')
    if (!byMonthKey.has(key)) {
      byMonthKey.set(key, { 
        _id: buildMonthServicePlaceholder(current), 
        date: current.toISOString() 
      })
    }
    current = current.subtract(1, 'month')
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