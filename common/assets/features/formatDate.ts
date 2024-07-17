import { RangePickerProps } from 'antd/lib/date-picker'
import moment from 'moment'
import 'moment/locale/uk'

export const dateToDefaultFormat = (deadline: string): string =>
  moment(deadline).locale('uk').format('LL')

export const isDeadlineExpired = (deadline: string): boolean =>
  moment().locale('uk').isAfter(moment(deadline), 'day')

export const dateToPick = (deadline: string): boolean =>
  moment().locale('uk').isAfter(moment(deadline))

export const disabledDate: RangePickerProps['disabledDate'] = (current) => {
  return current && current < moment().locale('uk').startOf('day')
}

export const dateToDayYearMonthFormat = (date: Date): string =>
  moment(date).format('DD-MM-YYYY')



export const dateToMonthYear = (date: Date): string =>
  moment(date).format('MMMM YYYY')

  export const dateToYear = (date: Date): string =>
  moment(date).format('YYYY')

export const getPreviousMonth = (date?: string) => {
  const currentInvoiceDate = moment(date).subtract(1, 'month')
  const month = currentInvoiceDate.month() + 1
  const year = currentInvoiceDate.year()
  return { month, year }
}