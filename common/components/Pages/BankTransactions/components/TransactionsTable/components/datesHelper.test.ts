import dayjs from 'dayjs'
import { getRollingServices, formatDate, toDate, parseDate } from './datesHelper'

jest.mock('@common/components/Forms/AddPaymentForm/month-service-placeholder', () => ({
  buildMonthServicePlaceholder: (date: any) => `placeholder-${date.format('YYYY-MM')}`,
}))

describe('getRollingServices', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2024-03-15'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('should return existing services and fill gaps with placeholders', () => {
    const existingServices = [
      { _id: 'svc-march', date: '2024-03-01T00:00:00.000Z' }
    ]
    
    const result = getRollingServices(existingServices, 2)

    expect(result).toHaveLength(3)
    expect(result[0]._id).toBe('svc-march')
    expect(result[1]._id).toBe('placeholder-2024-02')
    expect(result[2]._id).toBe('placeholder-2024-01')
  })

  it('should prioritize real services over placeholders for the same month', () => {
    const existingServices = [
      { _id: 'real-id', date: '2024-03-10T10:00:00.000Z' }
    ]
    const result = getRollingServices(existingServices, 1)
    expect(result[0]._id).toBe('real-id')
  })

  it('should sort services in descending order by date', () => {
    const services = [
      { _id: 'old', date: '2024-01-01T00:00:00.000Z' },
      { _id: 'new', date: '2024-03-01T00:00:00.000Z' }
    ]
    const result = getRollingServices(services, 0)
    expect(result[0]._id).toBe('new')
  })
})

describe('Date Utility functions', () => {
  it('formatDate should return formatted string in Ukrainian', () => {
    const date = '2024-03-01T00:00:00.000Z'
    expect(formatDate(date, 'MMMM YYYY')).toBe('березень 2024')
  })

  it('toDate should return native JS Date object', () => {
    const dateStr = '2024-03-01'
    const result = toDate(dateStr)
    expect(result).toBeInstanceOf(Date)
    expect(result.getFullYear()).toBe(2024)
  })

  it('parseDate should correctly parse custom formats', () => {
    const customStr = '22.12.2025'
    const result = parseDate(customStr, 'DD.MM.YYYY')
    expect(result.format('YYYY-MM-DD')).toBe('2025-12-22')
  })
})