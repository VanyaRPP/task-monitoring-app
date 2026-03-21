jest.mock('@modules/models/Payment', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
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
  getTotalGeneralSumPipeline: jest.fn(),
}))

jest.mock('@utils/helpers', () => ({
  getDistinctCompanyAndDomain: jest.fn(),
  getFilterForAddress: jest.fn(),
}))

jest.mock('@utils/pipelines', () => ({
  getStreetsPipeline: jest.fn(),
}))

import Domain from '@modules/models/Domain'
import Payment from '@modules/models/Payment'
import ProfitService from '@common/services/profitService/profit.service'
import { sendInvoiceEmail } from '@utils/email/sendInvoiceEmail'
import { createPayment } from './payment.service'

const domainFindByIdMock = Domain.findById as jest.Mock
const paymentCreateMock = Payment.create as jest.Mock
const createProfitMock = ProfitService.create as jest.Mock
const sendInvoiceEmailMock = sendInvoiceEmail as jest.Mock

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
