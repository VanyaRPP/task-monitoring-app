import { ServiceType } from '@utils/constants'
import { resolvePrevReading } from './prevReading'

const prev = (fields: any[]) => ({ invoice: fields })

describe('resolvePrevReading', () => {
  it('matches by serviceId first (the stable, unique key)', () => {
    const payment = prev([
      {
        type: ServiceType.Custom,
        serviceId: 'a',
        fieldName: 'elektryka',
        amount: 100,
      },
      {
        type: ServiceType.Custom,
        serviceId: 'b',
        fieldName: 'elektryka',
        amount: 250,
      },
    ])
    expect(
      resolvePrevReading(payment, { serviceId: 'b', fieldName: 'elektryka' })
    ).toBe(250)
    expect(
      resolvePrevReading(payment, { serviceId: 'a', fieldName: 'elektryka' })
    ).toBe(100)
  })

  it('falls back to fieldName for legacy rows without a serviceId', () => {
    const payment = prev([
      { type: ServiceType.Custom, fieldName: 'voda', amount: 42 },
    ])
    expect(
      resolvePrevReading(payment, { serviceId: 'x', fieldName: 'voda' })
    ).toBe(42)
  })

  it('does not fall back to a non-custom field of the same fieldName', () => {
    const payment = prev([
      { type: ServiceType.Electricity, fieldName: 'voda', amount: 999 },
    ])
    expect(
      resolvePrevReading(payment, { serviceId: 'x', fieldName: 'voda' })
    ).toBe(0)
  })

  it('returns 0 with no previous payment, no match, or a bad amount', () => {
    expect(resolvePrevReading(undefined, { serviceId: 'a' })).toBe(0)
    expect(
      resolvePrevReading(prev([]), { serviceId: 'a', fieldName: 'x' })
    ).toBe(0)
    expect(
      resolvePrevReading(
        prev([{ type: ServiceType.Custom, serviceId: 'a', amount: 'oops' }]),
        {
          serviceId: 'a',
        }
      )
    ).toBe(0)
  })
})
