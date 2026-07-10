import { ServiceType } from '@utils/constants'
import type { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { buildAutoCustomColumns } from './usePaymentColumns'

const payment = (invoice: any[]): IExtendedPayment =>
  ({ _id: Math.random().toString(36).slice(2), invoice }) as any

const withData = (data: IExtendedPayment[]) =>
  buildAutoCustomColumns({ payments: { data } as any })

const titlesOf = (cols: ReturnType<typeof buildAutoCustomColumns>) =>
  cols.map((c) => c.title)

describe('buildAutoCustomColumns', () => {
  it('creates a column for a custom service with a NEGATIVE sum', () => {
    const cols = withData([
      payment([{ type: ServiceType.Custom, name: 'Знижка', sum: -50 }]),
    ])
    expect(titlesOf(cols)).toContain('Знижка')
  })

  it('creates a column for a custom service with a positive sum', () => {
    const cols = withData([
      payment([{ type: ServiceType.Custom, name: 'ewqeqw', sum: 10 }]),
    ])
    expect(titlesOf(cols)).toContain('ewqeqw')
  })

  it('skips a custom service whose sum is exactly 0', () => {
    const cols = withData([
      payment([{ type: ServiceType.Custom, name: 'Порожня', sum: 0 }]),
    ])
    expect(titlesOf(cols)).not.toContain('Порожня')
  })

  it('does not duplicate a column when the same name appears across payments', () => {
    const cols = withData([
      payment([{ type: ServiceType.Custom, name: 'Знижка', sum: -50 }]),
      payment([{ type: ServiceType.Custom, name: 'Знижка', sum: -20 }]),
    ])
    expect(titlesOf(cols).filter((t) => t === 'Знижка')).toHaveLength(1)
  })

  it('ignores non-custom invoice rows', () => {
    const cols = withData([
      payment([{ type: 'maintenancePrice', name: 'Утримання', sum: 225 }]),
    ])
    expect(cols).toHaveLength(0)
  })

  it('returns no columns when there are no payments', () => {
    expect(buildAutoCustomColumns({ payments: { data: [] } as any })).toEqual(
      []
    )
    expect(buildAutoCustomColumns({})).toEqual([])
  })

  it('sorter aggregates negative sums (−50 sorts before −20)', () => {
    const [col] = withData([
      payment([{ type: ServiceType.Custom, name: 'Знижка', sum: -50 }]),
    ])
    const a = payment([{ type: ServiceType.Custom, name: 'Знижка', sum: -50 }])
    const b = payment([{ type: ServiceType.Custom, name: 'Знижка', sum: -20 }])
    expect((col as any).sorter(a, b)).toBeLessThan(0)
  })
})
