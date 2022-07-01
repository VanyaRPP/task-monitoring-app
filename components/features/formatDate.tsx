import moment from 'moment'

export const dateToDefaultFormat = (deadline: string): string =>
  moment(deadline).format('MMM Do YY')

export const isDeadlineExpired = (deadline: string): boolean =>
  moment().isAfter(moment(deadline))
