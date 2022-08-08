import { RangePickerProps } from 'antd/lib/date-picker'
import moment from 'moment'
import 'moment/locale/uk'
import { Date } from 'mongoose'

export const dateToDefaultFormat = (deadline: string): string =>
  moment(deadline).locale('uk').format('LL')

export const isDeadlineExpired = (deadline: string): boolean =>
  moment().locale('uk').isAfter(moment(deadline), 'day')

export const disabledDate: RangePickerProps['disabledDate'] = (current) => {
  return current && current < moment().locale('uk').startOf('day')
}
