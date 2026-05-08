import { toFirstUpperCase } from '@utils/helpers'
import { DatePickerProps } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import 'dayjs/locale/en'
import localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(localizedFormat)
dayjs.locale('uk')

export const dateToDefaultFormat = (deadline: string): string =>
  dayjs(deadline).format('LL')

export const isDeadlineExpired = (deadline: string): boolean =>
  dayjs().isAfter(dayjs(deadline), 'day')

export const dateToPick = (deadline: string): boolean =>
  dayjs().isAfter(dayjs(deadline))

export const disabledDate: DatePickerProps['disabledDate'] = (current) => {
  return current && current < dayjs().startOf('day')
}

export const dateToDayYearMonthFormat = (date: Date): string =>
  dayjs(date).format('DD-MM-YYYY')

export const dateToMonthYear = (date: Date): string =>
  dayjs(date).format('MMMM YYYY')

export const dateToMonthYearEn = (date: Date | string): string =>
  dayjs(date).locale('en').format('MMMM YYYY')

export const dateToMonth = (date: Date): string => dayjs(date).format('MMMM')

export const dateToYear = (date: Date): string => dayjs(date).format('YYYY')

export const getPreviousMonth = (date?: string) => {
  const currentInvoiceDate = dayjs(date).subtract(1, 'month')
  const month = currentInvoiceDate.month() + 1
  const year = currentInvoiceDate.year()
  return { month, year }
}

export const getFormattedDate = (date: Date, format = 'MMMM'): string => {
  return toFirstUpperCase(dayjs(date).format(format))
}

export const formatInvoiceDate = (date?: Date | string | null): string => {
  if (!date) return ''
  const d = dayjs(date)
  return d.isValid() ? d.format('DD.MM.YYYY') : ''
}

export const formatInvoiceDueDate = (date?: Date | string | null, days = 5): string => {
  if (!date) return ''
  const d = dayjs(date)
  return d.isValid() ? d.add(days, 'd').format('DD.MM.YYYY') : ''
}

export const formatInvoiceDateUs = (date?: Date | string | null): string => {
  if (!date) return ''
  const d = dayjs(date)
  return d.isValid() ? d.format('MM/DD/YYYY') : ''
}

export const formatInvoiceDueDateUs = (date?: Date | string | null, days = 5): string => {
  if (!date) return ''
  const d = dayjs(date)
  return d.isValid() ? d.add(days, 'd').format('MM/DD/YYYY') : ''
}

export const dateShiftMs = (date: Date | string, ms: number): Date =>
  new Date(new Date(date).getTime() + ms)

/**
 * Combine the user-selected day (year/month/date from a Dayjs instance) with
 * the *current* wall-clock time (UTC hours/minutes/seconds/ms). Used when
 * saving payments — user picks a date, we keep the time-of-save granular.
 *
 * Returns the current Date when input is falsy.
 */
export const combineDayWithCurrentTime = (
  selectedDay?: { year(): number; month(): number; date(): number } | null
): Date => {
  if (!selectedDay) return new Date()
  const now = new Date()
  return new Date(
    Date.UTC(
      selectedDay.year(),
      selectedDay.month(),
      selectedDay.date(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds()
    )
  )
}
