/**
 * @jest-environment node
 */
import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import Payment from '@common/modules/models/Payment'
import RealEstate from '@modules/models/RealEstate'
import { logPaymentMutation } from '@common/modules/services/paymentAudit'
import { reserveInvoiceNumbers } from '@common/services/paymentService/payment.service'
import { Operations, ServiceType } from '@utils/constants'
import { OPENING_BALANCE_FIELD } from '@utils/debt-calculation/prefill'
import type { IStatementImport } from '@utils/debt-calculation/statement'
import {
  applyCompanyStatementImport,
  buildStatementPayments,
  loadImportTarget,
  StatementImportError,
} from './statementImport.service'

jest.mock('@modules/models/CustomService', () => ({
  __esModule: true,
  default: { findOne: jest.fn(), find: jest.fn() },
}))
jest.mock('@modules/models/Domain', () => ({
  __esModule: true,
  default: { exists: jest.fn(), findById: jest.fn() },
}))
jest.mock('@modules/models/RealEstate', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}))
jest.mock('@common/modules/models/Payment', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    insertMany: jest.fn(),
    deleteMany: jest.fn(),
  },
}))
jest.mock('@common/modules/services/paymentAudit', () => ({
  logPaymentMutation: jest.fn(),
}))
jest.mock('@common/services/paymentService/payment.service', () => ({
  reserveInvoiceNumbers: jest.fn(),
}))

const DOMAIN = '507f1f77bcf86cd799439011'
const COMPANY = '507f1f77bcf86cd799439012'
const HOUSING = '507f1f77bcf86cd799439013'

const lean = (value: unknown) => ({ lean: jest.fn().mockResolvedValue(value) })
const populated = (value: unknown) => {
  const query: any = {
    populate: jest.fn(() => query),
    lean: jest.fn().mockResolvedValue(value),
  }
  return query
}

const company = {
  _id: COMPANY,
  companyName: 'Квартира №72',
  description: 'Покровська 149',
  adminEmails: ['tenant@example.com'],
  domain: { _id: DOMAIN, name: 'ОСББ', description: 'ОСББ «Покровська»' },
  street: 'street-1',
}
const target = {
  company,
  housing: { serviceId: HOUSING, name: 'Квартплата' },
}
const actor = { isGlobalAdmin: false, user: { _id: 'u1', email: 'admin@x.ua' } }

const statement: IStatementImport = {
  openingBalance: { year: 2019, month: 11, amount: 16641.15 },
  months: [
    { year: 2019, month: 11, charged: 424.46, correction: -6.86, paid: 0 },
    { year: 2019, month: 12, charged: 424.46, correction: 0, paid: 400 },
    // Nothing billed, nothing paid - produces nothing.
    { year: 2020, month: 1, charged: 0, correction: 0, paid: 0 },
  ],
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(reserveInvoiceNumbers as jest.Mock).mockResolvedValue(501)
})

describe('buildStatementPayments', () => {
  const docs = buildStatementPayments({
    target,
    statement,
    months: statement.months,
    createOpening: true,
    source: 'вул. Покровська буд. 149 кв. 72',
    firstInvoiceNumber: 501,
  })

  it('вхідне сальдо, інвойс з коректурою, оплата — по порядку й з номерами підряд', () => {
    expect(
      docs.map(({ type, invoiceNumber }) => [type, invoiceNumber])
    ).toEqual([
      [Operations.Debit, 501],
      [Operations.Debit, 502],
      [Operations.Debit, 503],
      [Operations.Credit, 504],
    ])
  })

  it('вхідне сальдо — окремий рядок з міткою, щоб розрахунок не рахував його нарахуванням', () => {
    expect(docs[0]).toMatchObject({
      generalSum: 16641.15,
      invoice: [
        {
          name: 'Вхідне сальдо',
          fieldName: OPENING_BALANCE_FIELD,
          sum: 16641.15,
        },
      ],
      description:
        'З розрахунку заборгованості: вул. Покровська буд. 149 кв. 72',
    })
  })

  it('коректура — окремий рядок квартплати з мінусом, сума інвойсу — нетто', () => {
    expect(docs[1]).toMatchObject({
      generalSum: 417.6,
      invoice: [
        {
          type: ServiceType.HousingFee,
          name: 'Квартплата',
          serviceId: HOUSING,
          sum: 424.46,
        },
        {
          type: ServiceType.HousingFee,
          name: 'Коректура',
          serviceId: HOUSING,
          sum: -6.86,
        },
      ],
      reciever: expect.objectContaining({ companyName: 'Квартира №72' }),
      provider: { description: 'ОСББ «Покровська»' },
    })
  })

  it('дати — полудень UTC першого числа: місяць не зсувається в жодному поясі', () => {
    expect(docs[1].invoiceCreationDate).toEqual(
      new Date(Date.UTC(2019, 10, 1, 12))
    )
    expect(docs[3]).toMatchObject({
      paidAt: new Date(Date.UTC(2019, 11, 1, 12)),
      generalSum: 400,
      invoice: [],
    })
  })
})

describe('applyCompanyStatementImport', () => {
  it('створює платежі одним insertMany, без листів, і пише їх у журнал однією партією', async () => {
    ;(Payment.find as jest.Mock).mockReturnValueOnce(populated([]))
    ;(Payment.insertMany as jest.Mock).mockImplementation(async (docs) =>
      docs.map((doc: any, index: number) => ({ ...doc, _id: `new-${index}` }))
    )

    const { result } = await applyCompanyStatementImport({
      target,
      statement,
      actor,
    })

    expect(Payment.insertMany).toHaveBeenCalledTimes(1)
    // One block of numbers for the whole import, consecutive in doc order.
    expect(reserveInvoiceNumbers).toHaveBeenCalledTimes(1)
    expect(reserveInvoiceNumbers).toHaveBeenCalledWith(4)
    const inserted = (Payment.insertMany as jest.Mock).mock.calls[0][0]
    expect(inserted.map(({ invoiceNumber }) => invoiceNumber)).toEqual([
      501, 502, 503, 504,
    ])
    expect(result.created).toEqual({ debits: 2, credits: 1, opening: true })
    expect(result.createdIds).toHaveLength(4)
    const logs = (logPaymentMutation as jest.Mock).mock.calls.map(
      ([args]) => args
    )
    expect(logs).toHaveLength(4)
    expect(new Set(logs.map(({ batchId }) => String(batchId))).size).toBe(1)
    expect(
      logs.every(
        ({ source, actionType }) =>
          source === 'debt-import' && actionType === 'BULK_CREATE'
      )
    ).toBe(true)
  })

  it('«з фото» для конфлікту: спершу створює, потім видаляє записи системи — лише цієї компанії', async () => {
    const existing = {
      _id: 'old-debit',
      type: Operations.Debit,
      invoiceCreationDate: new Date(Date.UTC(2019, 11, 1, 12)),
      invoice: [{ type: ServiceType.HousingFee, sum: 500 }],
    }
    ;(Payment.find as jest.Mock)
      .mockReturnValueOnce(populated([existing]))
      .mockResolvedValueOnce([existing])
    const order: string[] = []
    ;(Payment.insertMany as jest.Mock).mockImplementation(async (docs) => {
      order.push('create')
      return docs.map((doc: any, index: number) => ({
        ...doc,
        _id: `new-${index}`,
      }))
    })
    ;(Payment.deleteMany as jest.Mock).mockImplementation(async () => {
      order.push('delete')
    })

    const { result } = await applyCompanyStatementImport({
      target,
      statement,
      resolutions: { '2019-12': 'import' },
      actor,
    })

    expect(order).toEqual(['create', 'delete'])
    expect((Payment.find as jest.Mock).mock.calls[1][0]).toEqual({
      _id: { $in: ['old-debit'] },
      company: COMPANY,
    })
    expect(result.deletedIds).toEqual(['old-debit'])
  })
})

describe('loadImportTarget', () => {
  it('компанія з іншого домену — 404', async () => {
    ;(RealEstate.findOne as jest.Mock).mockReturnValue(populated(null))

    await expect(
      loadImportTarget(DOMAIN, COMPANY, actor)
    ).rejects.toMatchObject({ status: 404 })
  })

  it('не адмін домену — 403', async () => {
    ;(RealEstate.findOne as jest.Mock).mockReturnValue(populated(company))
    ;(Domain.exists as jest.Mock).mockResolvedValue(null)

    await expect(loadImportTarget(DOMAIN, COMPANY, actor)).rejects.toEqual(
      new StatementImportError(403, 'Немає доступу')
    )
    expect(Domain.exists).toHaveBeenCalledWith({
      _id: DOMAIN,
      adminEmails: 'admin@x.ua',
    })
  })

  it('домен без «Квартплати» — 400', async () => {
    ;(RealEstate.findOne as jest.Mock).mockReturnValue(populated(company))
    ;(Domain.exists as jest.Mock).mockResolvedValue({ _id: DOMAIN })
    ;(CustomService.findOne as jest.Mock).mockReturnValue(lean(null))
    ;(Domain.findById as jest.Mock).mockReturnValue(
      lean({ customServices: [] })
    )
    ;(CustomService.find as jest.Mock).mockReturnValue(lean([]))

    await expect(
      loadImportTarget(DOMAIN, COMPANY, actor)
    ).rejects.toMatchObject({ status: 400 })
  })

  it('знаходить «Квартплату» в каталозі домену', async () => {
    ;(RealEstate.findOne as jest.Mock).mockReturnValue(populated(company))
    ;(CustomService.findOne as jest.Mock).mockReturnValue(lean(null))
    ;(Domain.findById as jest.Mock).mockReturnValue(
      lean({ customServices: [{ services: [HOUSING] }] })
    )
    ;(CustomService.find as jest.Mock).mockReturnValue(
      lean([
        { _id: HOUSING, name: 'Внесок', serviceType: ServiceType.HousingFee },
      ])
    )

    const loaded = await loadImportTarget(DOMAIN, COMPANY, {
      ...actor,
      isGlobalAdmin: true,
    })

    expect(Domain.exists).not.toHaveBeenCalled()
    expect(loaded.housing).toEqual({ serviceId: HOUSING, name: 'Внесок' })
  })
})
