import dayjs from 'dayjs'
import { combineDayWithCurrentTime } from '@common/assets/features/formatDate'

describe('invoiceCreationDate time creation', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2026, 3, 27, 16, 15, 15, 0))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should use selected date and current time', () => {
    const formData = {
      invoiceCreationDate: dayjs(new Date(2026, 3, 27)),
    }

    const result = combineDayWithCurrentTime(formData.invoiceCreationDate)

    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(3)
    expect(result.getDate()).toBe(27)

    expect(result.getHours()).toBe(16)
    expect(result.getMinutes()).toBe(15)
    expect(result.getSeconds()).toBe(15)
  })

  it('should use current date and time when invoiceCreationDate is empty', () => {
    const now = new Date(2026, 3, 27, 16, 15, 15, 0)
    jest.setSystemTime(now)

    const formData = {
      invoiceCreationDate: null,
    }

    const result = combineDayWithCurrentTime(formData.invoiceCreationDate)

    expect(result.getTime()).toBe(now.getTime())
  })
})
