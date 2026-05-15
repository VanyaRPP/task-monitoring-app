const sortMock = jest.fn().mockReturnThis()
const skipMock = jest.fn().mockReturnThis()
const limitMock = jest.fn().mockReturnThis()
const populateMock = jest.fn().mockReturnThis()
const leanMock = jest.fn().mockResolvedValue([])
const findMock = jest.fn(() => ({
  sort: sortMock,
  skip: skipMock,
  limit: limitMock,
  populate: populateMock,
  lean: leanMock,
}))

jest.mock('@modules/models/Payment', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    find: findMock,
    aggregate: jest.fn().mockResolvedValue([]),
    countDocuments: jest.fn().mockResolvedValue(0),
  },
}))

jest.mock('@common/services/profitService/profit.service', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}))

jest.mock('@utils/email/sendInvoiceEmail', () => ({
  sendInvoiceEmail: jest.fn(),
}))

jest.mock('@modules/models/Domain', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}))

jest.mock('@modules/models/RealEstate', () => ({
  __esModule: true,
  default: {},
}))

jest.mock('@modules/models/Service', () => ({
  __esModule: true,
  default: {},
}))

jest.mock('@pages/api/spacehub/payment/pipelines', () => ({
  getCreditDebitPipeline: jest.fn(),
  getInvoicesTotalPipeline: jest.fn(),
  getMaxInvoiceNumber: jest.fn(() => [
    { $group: { _id: null, maxNumber: { $max: '$invoiceNumber' } } },
  ]),
  getTotalGeneralSumPipeline: jest.fn(),
}))

jest.mock('@utils/helpers', () => ({
  getDistinctCompanyAndDomain: jest
    .fn()
    .mockResolvedValue({ distinctDomains: [], distinctCompanies: [] }),
  getFilterForAddress: jest.fn().mockReturnValue({}),
}))

jest.mock('@utils/pipelines', () => ({
  getStreetsPipeline: jest.fn(),
}))

import Domain from '@modules/models/Domain'
import Payment from '@modules/models/Payment'
import ProfitService from '@common/services/profitService/profit.service'
import { sendInvoiceEmail } from '@utils/email/sendInvoiceEmail'
import {
  createPayment,
  getNextInvoiceNumber,
  getPayments,
} from './payment.service'
import { SortOrder, Operations } from '@utils/constants'

const domainFindByIdMock = Domain.findById as jest.Mock
const paymentCreateMock = Payment.create as jest.Mock
const createProfitMock = ProfitService.create as jest.Mock
const sendInvoiceEmailMock = sendInvoiceEmail as jest.Mock

const globalAdminContext = {
  isGlobalAdmin: true,
  isDomainAdmin: false,
  isUser: false,
  user: { email: 'admin@test.com' },
}

describe('getPayments — sorting', () => {
  beforeEach(() => jest.clearAllMocks())

  it('passes correct sort params to MongoDB', async () => {
    await getPayments({}, globalAdminContext)
    expect(sortMock).toHaveBeenCalledWith({
      invoiceCreationDate: SortOrder.DESC,
      type: SortOrder.ASC,
    })
  })

  it('SortOrder.ASC on type puts credit before debit (alphabetical invariant)', () => {
    const types = [Operations.Debit, Operations.Credit]
    const sorted = [...types].sort((a, b) => a.localeCompare(b) * SortOrder.ASC)
    expect(sorted[0]).toBe(Operations.Credit)
    expect(sorted[1]).toBe(Operations.Debit)
  })
})

describe('createPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createProfitMock.mockResolvedValue({})
    sendInvoiceEmailMock.mockResolvedValue(true)
    domainFindByIdMock.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    })
  })

  it('sends invoice email after creating a debit payment', async () => {
    const paymentObject = {
      _id: 'payment-id',
      id: 'payment-id',
      domain: 'domain-id',
      type: 'debit',
      generalSum: 1250,
      invoiceCreationDate: new Date('2026-03-16T00:00:00.000Z'),
      invoiceNumber: 77,
      description: '',
      reciever: {
        companyName: 'Domain Admin',
        adminEmails: ['admin@example.com'],
        description: 'Receiver',
      },
      provider: {
        description: 'Provider',
      },
      toObject: jest.fn(),
    }

    paymentObject.toObject.mockReturnValue({
      ...paymentObject,
      toObject: undefined,
    })

    paymentCreateMock.mockResolvedValue(paymentObject)

    const result = await createPayment({ invoiceNumber: 77 }, true)

    expect(result).toBe(paymentObject)
    expect(createProfitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: 'domain-id',
        payment: 'payment-id',
        amount: 1250,
        type: 'debit',
        invoiceNumber: '77',
      })
    )
    expect(sendInvoiceEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceNumber: 77,
        reciever: expect.objectContaining({
          adminEmails: ['admin@example.com'],
        }),
      })
    )
  })

  it('does not send invoice email for credit payments', async () => {
    const paymentObject = {
      _id: 'payment-id',
      id: 'payment-id',
      domain: 'domain-id',
      type: 'credit',
      generalSum: 300,
      invoiceCreationDate: new Date('2026-03-16T00:00:00.000Z'),
      invoiceNumber: 78,
      description: 'Credit payment',
      reciever: {
        companyName: 'Domain Admin',
        adminEmails: ['admin@example.com'],
        description: 'Receiver',
      },
      provider: {
        description: 'Provider',
      },
      toObject: jest.fn(() => ({})),
    }

    paymentCreateMock.mockResolvedValue(paymentObject)

    await createPayment({ invoiceNumber: 78 }, true)

    expect(sendInvoiceEmailMock).not.toHaveBeenCalled()
  })

  it('keeps payment creation successful when email sending fails', async () => {
    const paymentObject = {
      _id: 'payment-id',
      id: 'payment-id',
      domain: 'domain-id',
      type: 'debit',
      generalSum: 1250,
      invoiceCreationDate: new Date('2026-03-16T00:00:00.000Z'),
      invoiceNumber: 79,
      description: '',
      reciever: {
        companyName: 'Domain Admin',
        adminEmails: ['admin@example.com'],
        description: 'Receiver',
      },
      provider: {
        description: 'Provider',
      },
      toObject: jest.fn(),
    }

    paymentObject.toObject.mockReturnValue({
      ...paymentObject,
      toObject: undefined,
    })

    paymentCreateMock.mockResolvedValue(paymentObject)
    sendInvoiceEmailMock.mockRejectedValue(new Error('smtp unavailable'))
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    await expect(createPayment({ invoiceNumber: 79 }, true)).resolves.toBe(
      paymentObject
    )
    expect(createProfitMock).toHaveBeenCalled()
    expect(sendInvoiceEmailMock).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('falls back to domain admin emails when payment snapshot has no recipients', async () => {
    const paymentObject = {
      _id: 'payment-id',
      id: 'payment-id',
      domain: 'domain-id',
      type: 'debit',
      generalSum: 1250,
      invoiceCreationDate: new Date('2026-03-16T00:00:00.000Z'),
      invoiceNumber: 80,
      description: '',
      provider: {
        description: 'Provider',
      },
      toObject: jest.fn(),
    }

    paymentObject.toObject.mockReturnValue({
      ...paymentObject,
      toObject: undefined,
    })

    paymentCreateMock.mockResolvedValue(paymentObject)
    domainFindByIdMock.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        name: 'Fallback Domain',
        adminEmails: ['domain-admin@example.com'],
      }),
    })

    await createPayment({ invoiceNumber: 80 }, true)

    expect(sendInvoiceEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reciever: expect.objectContaining({
          companyName: 'Fallback Domain',
          adminEmails: ['domain-admin@example.com'],
        }),
      })
    )
  })
})

describe('getNextInvoiceNumber', () => {
  const aggregateMock = Payment.aggregate as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns max invoice number + 1', async () => {
    aggregateMock.mockResolvedValueOnce([{ maxNumber: 42 }])
    const next = await getNextInvoiceNumber()
    expect(next).toBe(43)
  })

  it('returns 1 when there are no payments yet (empty aggregation result)', async () => {
    aggregateMock.mockResolvedValueOnce([])
    const next = await getNextInvoiceNumber()
    expect(next).toBe(1)
  })

  it('returns 1 when maxNumber is missing on the aggregation result', async () => {
    aggregateMock.mockResolvedValueOnce([{}])
    const next = await getNextInvoiceNumber()
    expect(next).toBe(1)
  })

  it('returns sequential numbers when called repeatedly with growing max', async () => {
    aggregateMock
      .mockResolvedValueOnce([{ maxNumber: 10 }])
      .mockResolvedValueOnce([{ maxNumber: 11 }])
      .mockResolvedValueOnce([{ maxNumber: 12 }])

    expect(await getNextInvoiceNumber()).toBe(11)
    expect(await getNextInvoiceNumber()).toBe(12)
    expect(await getNextInvoiceNumber()).toBe(13)
  })
})
