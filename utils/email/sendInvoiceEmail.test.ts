import { IPayment } from '@common/api/paymentApi/payment.api.types'
import nodemailer from 'nodemailer'
import { generatePdf } from '@utils/pdf/bufferGenerators'
import { sendInvoiceEmail } from './sendInvoiceEmail'

jest.mock('@utils/pdf/bufferGenerators', () => ({
  generatePdf: jest.fn(),
}))

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}))

const createTransportMock = nodemailer.createTransport as jest.Mock
const generatePdfMock = generatePdf as jest.Mock
const sendMailMock = jest.fn()

const payment: IPayment = {
  invoiceNumber: 25,
  type: 'debit',
  invoiceCreationDate: new Date('2026-03-16T00:00:00.000Z'),
  domain: 'domain-id',
  street: 'street-id',
  company: 'company-id',
  monthService: 'service-id',
  invoice: [],
  provider: {
    description: 'Provider',
  },
  reciever: {
    companyName: 'Space Hub',
    adminEmails: ['admin@example.com', 'admin@example.com'],
    description: 'Receiver',
  },
  generalSum: 1000,
}

describe('sendInvoiceEmail', () => {
  const envBackup = { ...process.env }

  beforeEach(() => {
    process.env.EMAIL_SERVER_HOST = 'smtp.example.com'
    process.env.EMAIL_SERVER_PORT = '465'
    process.env.EMAIL_SERVER_USER = 'mailer@example.com'
    process.env.EMAIL_SERVER_PASSWORD = 'secret'
    process.env.EMAIL_FROM = 'billing@example.com'
    delete process.env.EMAIL_SERVER_SECURE

    sendMailMock.mockResolvedValue({
      messageId: 'message-id',
      accepted: ['admin@example.com'],
      rejected: [],
      response: '250 OK',
    })
    createTransportMock.mockReturnValue({
      sendMail: sendMailMock,
    })
    generatePdfMock.mockResolvedValue(Buffer.from('pdf'))
  })

  afterEach(() => {
    process.env = { ...envBackup }
    jest.clearAllMocks()
  })

  it('sends invoice pdf attachment to unique admin emails', async () => {
    const result = await sendInvoiceEmail(payment)

    expect(result).toBe(true)
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 465,
        secure: true,
      })
    )
    expect(generatePdfMock).toHaveBeenCalledWith(payment)
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'billing@example.com',
        to: 'billing@example.com',
        bcc: 'admin@example.com',
        subject: 'Invoice INV-25 for Space Hub',
        attachments: [
          expect.objectContaining({
            filename: 'Space_Hub-inv-25.pdf',
            contentType: 'application/pdf',
          }),
        ],
      })
    )
  })

  it('skips sending when there are no recipients', async () => {
    const result = await sendInvoiceEmail({
      ...payment,
      reciever: {
        ...payment.reciever,
        adminEmails: [],
      },
    })

    expect(result).toBe(false)
    expect(createTransportMock).not.toHaveBeenCalled()
    expect(generatePdfMock).not.toHaveBeenCalled()
    expect(sendMailMock).not.toHaveBeenCalled()
  })
})
