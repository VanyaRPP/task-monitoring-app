import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { ServiceType } from '@utils/constants'
import { invoiceCSFilter } from '@utils/helpers'
import { getInvoices } from '@utils/getInvoices'
import { buildBulkInvoiceMap } from './buildInvoiceMap'
import serviceFilter from '@components/AddPaymentModal/serviceFilter'

const customGrechka = {
  _id: 'svc-grechka',
  label: 'Гречка',
  fieldName: 'hrechka',
  price: 5,
}
const customKompot = {
  _id: 'svc-kompot',
  label: 'Компот',
  fieldName: 'kompot',
  price: 10,
}

const baseCompany = {
  _id: 'company-1',
  totalArea: 6,
  servicePricePerMeter: 0,
  pricePerMeter: 0,
  rentPart: 0,
  waterPart: 0,
  cleaning: 0,
  discount: 0,
  inflicion: false,
  garbageCollector: false,
  customServices: [customGrechka, customKompot],
}

const baseService = {
  _id: 'service-1',
  date: new Date('2026-04-30'),
  domain: { _id: 'domain-1' },
  street: { _id: 'street-1' },
  rentPrice: 0,
  electricityPrice: 0,
  waterPrice: 0,
  waterPriceTotal: 0,
  garbageCollectorPrice: 0,
  inflicionPrice: 0,
  customServices: [],
}

const allowedServices = [
  { _id: customGrechka._id, fieldName: 'hrechka', name: 'Гречка' },
  { _id: customKompot._id, fieldName: 'kompot', name: 'Компот' },
]


const simulateBulkSavedInvoice = (invoiceMap: Record<string, IPaymentField>) => {
  const list = Object.values(invoiceMap).filter(({ sum }) => sum)
  return invoiceCSFilter(list)
}

const simulateSingleSavedInvoice = (
  company: any,
  service: any,
  prevService?: any,
  prevPayment?: any
) => {
  const all = getInvoices({ company, service, prevService, prevPayment })
  const filtered = serviceFilter(all, allowedServices as any)
  return filtered.filter((inv) => +inv.sum !== 0)
}

describe('buildBulkInvoiceMap', () => {
  it('does not duplicate custom services under both name and fieldName', () => {
    const all = getInvoices({ company: baseCompany as any, service: baseService as any })
    const filtered = serviceFilter(all, allowedServices as any)

    const map = buildBulkInvoiceMap(all, filtered)
    const saved = simulateBulkSavedInvoice(map)

    const fieldNames = saved
      .filter((inv) => inv.type === 'custom')
      .map((inv) => inv.fieldName)
      .sort()
    expect(fieldNames).toEqual(['hrechka', 'kompot'])
    expect(saved).toHaveLength(2)
  })

  it('keys custom services by fieldName, not by label', () => {
    const all: IPaymentField[] = [
      {
        type: ServiceType.Custom,
        name: 'Гречка',
        fieldName: 'hrechka',
        price: 5,
        sum: 5,
        amount: 1,
      } as any,
    ]
    const map = buildBulkInvoiceMap(all, all)

    expect(Object.keys(map)).toEqual(['hrechka'])
    expect(map['Гречка']).toBeUndefined()
  })

  it('keys standard services by type', () => {
    const all: IPaymentField[] = [
      { type: ServiceType.Discount, price: 0, sum: 0 } as any,
      { type: ServiceType.Maintenance, price: 1, sum: 6, amount: 6 } as any,
    ]
    const map = buildBulkInvoiceMap(all, all)

    expect(map[ServiceType.Discount]).toBeDefined()
    expect(map[ServiceType.Maintenance]).toBeDefined()
    expect(Object.keys(map)).toHaveLength(2)
  })
})

describe('bulk vs single saved invoice equivalence', () => {
  it('produces the same custom-service rows as the single-invoice modal', () => {
    const all = getInvoices({ company: baseCompany as any, service: baseService as any })
    const filtered = serviceFilter(all, allowedServices as any)

    const bulkSaved = simulateBulkSavedInvoice(buildBulkInvoiceMap(all, filtered))
    const singleSaved = simulateSingleSavedInvoice(baseCompany, baseService)

    const stripById = (rows: IPaymentField[]) =>
      rows
        .filter((r) => r.type === 'custom')
        .map((r) => ({
          name: r.name,
          fieldName: r.fieldName,
          price: r.price,
          sum: r.sum,
          type: r.type,
        }))
        .sort((a, b) => (a.fieldName || '').localeCompare(b.fieldName || ''))

    expect(stripById(bulkSaved)).toEqual(stripById(singleSaved))
  })

  it('regression: total of saved invoices does not double for custom services', () => {
    const all = getInvoices({ company: baseCompany as any, service: baseService as any })
    const filtered = serviceFilter(all, allowedServices as any)

    const bulkSaved = simulateBulkSavedInvoice(buildBulkInvoiceMap(all, filtered))
    const total = bulkSaved.reduce((acc, inv) => acc + (+inv.sum || 0), 0)

    expect(total).toBe(15)
  })
})
