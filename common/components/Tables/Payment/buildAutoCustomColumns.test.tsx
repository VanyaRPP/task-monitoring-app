import { ServiceType } from '@utils/constants'
import type { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import {
  buildAutoCustomColumns,
  getInvoiceCustomServiceNames,
} from './usePaymentColumns'

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

  it('shows only custom columns present in selectedColumns when provided', () => {
    const data = [
      payment([
        { type: ServiceType.Custom, name: 'Прибирання', sum: 100 },
        { type: ServiceType.Custom, name: 'Вивіз сміття', sum: 50 },
      ]),
    ]
    const cols = buildAutoCustomColumns({
      payments: { data } as any,
      selectedColumns: ['Прибирання'],
    })
    expect(titlesOf(cols)).toEqual(['Прибирання'])
  })

  it('hides every custom column when selectedColumns is empty', () => {
    const data = [
      payment([{ type: ServiceType.Custom, name: 'Прибирання', sum: 100 }]),
    ]
    expect(
      buildAutoCustomColumns({ payments: { data } as any, selectedColumns: [] })
    ).toEqual([])
  })

  it('gives every per-domain meter of one type its own column', () => {
    const cols = withData([
      payment([
        { type: 'electricityPrice', price: 10, sum: 300 },
        {
          type: 'electricityPrice',
          serviceId: 'svc-1',
          name: 'електрика(1)',
          sum: 80,
        },
        {
          type: 'electricityPrice',
          serviceId: 'svc-4',
          name: 'електропостача(4)',
          sum: 60,
        },
      ]),
    ])

    expect(titlesOf(cols)).toEqual(['електрика(1)', 'електропостача(4)'])
  })

  it('sums only the meter of its own column, not its type-mates', () => {
    const data = [
      payment([
        { type: 'electricityPrice', price: 10, sum: 300 },
        {
          type: 'electricityPrice',
          serviceId: 'svc-1',
          name: 'електрика(1)',
          sum: 80,
        },
        {
          type: 'electricityPrice',
          serviceId: 'svc-4',
          name: 'електропостача(4)',
          sum: 60,
        },
      ]),
    ]
    const [first] = withData(data)
    const empty = payment([])

    expect((first as any).sorter(data[0], empty)).toBe(80)
  })

  it('shows all custom columns when selectedColumns is omitted', () => {
    const data = [
      payment([{ type: ServiceType.Custom, name: 'Прибирання', sum: 100 }]),
    ]
    expect(titlesOf(withData(data))).toEqual(['Прибирання'])
  })
})

describe('getInvoiceCustomServiceNames', () => {
  it('collects unique custom names with a non-zero sum', () => {
    const data = [
      payment([
        { type: ServiceType.Custom, name: 'Прибирання', sum: 100 },
        { type: ServiceType.Custom, name: 'Прибирання', sum: 20 },
        { type: 'electricityPrice', name: 'Електро', sum: 5 },
        { type: ServiceType.Custom, name: 'Порожня', sum: 0 },
      ]),
    ]
    expect(getInvoiceCustomServiceNames({ payments: { data } as any })).toEqual(
      ['Прибирання']
    )
  })

  it('includes ad-hoc "Власне" fields that have no serviceId', () => {
    const data = [
      payment([{ type: ServiceType.Custom, name: 'Ремонт даху', sum: 10 }]),
    ]
    expect(getInvoiceCustomServiceNames({ payments: { data } as any })).toEqual(
      ['Ремонт даху']
    )
  })

  it('includes per-domain typed services (own serviceId) by their own name', () => {
    const data = [
      payment([
        { type: 'electricityPrice', price: 10, sum: 300 },
        {
          type: 'electricityPrice',
          serviceId: 'svc-1',
          name: 'електрика(1)',
          sum: 80,
        },
      ]),
    ]
    expect(getInvoiceCustomServiceNames({ payments: { data } as any })).toEqual(
      ['електрика(1)']
    )
  })

  it('returns [] when there are no payments', () => {
    expect(
      getInvoiceCustomServiceNames({ payments: { data: [] } as any })
    ).toEqual([])
    expect(getInvoiceCustomServiceNames({})).toEqual([])
  })
})
