import { RangePickerProps } from 'antd/lib/date-picker'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'

dayjs.locale('uk')

export const dateToDefaultFormat = (deadline: string): string =>
  dayjs(deadline).format('LL')

export const isDeadlineExpired = (deadline: string): boolean =>
  dayjs().isAfter(dayjs(deadline), 'day')

export const dateToPick = (deadline: string): boolean =>
  dayjs().isAfter(dayjs(deadline))

export const disabledDate: RangePickerProps['disabledDate'] = (current) => {
  return current && current < dayjs().startOf('day')
}

export const dateToDayYearMonthFormat = (date: Date): string =>
  dayjs(date).format('DD-MM-YYYY')

export const dateToMonthYear = (date: Date): string =>
  dayjs(date).format('MMMM YYYY')

export const getPreviousMonth = (date?: string) => {
  const currentInvoiceDate = dayjs(date).subtract(1, 'month')
  const month = currentInvoiceDate.month() + 1
  const year = currentInvoiceDate.year()
  return { month, year }
}
