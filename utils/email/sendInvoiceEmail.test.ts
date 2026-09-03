const sendMailMock = jest.fn()
const createTransportMock = jest.fn((..._args: unknown[]) => ({
  sendMail: sendMailMock,
}))
const generatePdfFromHtmlMock = jest.fn()

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: (...args: unknown[]) => createTransportMock(...args),
  },
}))

jest.mock('@utils/pdf/bufferGenerators', () => ({
  __esModule: true,
  generatePdfFromHtml: (...args: unknown[]) => generatePdfFromHtmlMock(...args),
}))

import { sendInvoiceEmail, type InvoiceEmailPayment } from './sendInvoiceEmail'

const ORIGINAL_ENV = process.env

const buildPayment = (
  overrides: Partial<InvoiceEmailPayment> = {}
): InvoiceEmailPayment => ({
  invoiceNumber: 101,
  invoiceCreationDate: new Date('2026-06-01T00:00:00.000Z'),
  invoice: [],
  provider: { description: 'Provider' } as InvoiceEmailPayment['provider'],
  reciever: {
    companyName: 'Acme',
    adminEmails: ['client@real.com'],
    description: 'desc',
  },
  generalSum: 500,
  type: 'debit',
  ...overrides,
})

describe('sendInvoiceEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'info').mockImplementation(() => undefined)
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    jest.spyOn(console, 'error').mockImplementation(() => undefined)

    process.env = {
      ...ORIGINAL_ENV,
      EMAIL_SERVER_HOST: 'smtp.example.com',
      EMAIL_SERVER_PORT: '587',
      EMAIL_SERVER_USER: 'smtp-user',
      EMAIL_SERVER_PASSWORD: 'smtp-pass',
      EMAIL_FROM: 'billing@example.com',
    }
    delete process.env.EMAIL_SERVER_SECURE

    sendMailMock.mockResolvedValue({
      messageId: 'mid-1',
      accepted: ['client@real.com'],
      rejected: [],
      response: '250 OK',
    })
    generatePdfFromHtmlMock.mockResolvedValue(Buffer.from('%PDF-1.4 fake'))
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  it('does not send and returns false when there are no recipients', async () => {
    const result = await sendInvoiceEmail(
      buildPayment({
        reciever: { companyName: 'Acme', adminEmails: [], description: '' },
      })
    )

    expect(result).toBe(false)
    expect(createTransportMock).not.toHaveBeenCalled()
    expect(sendMailMock).not.toHaveBeenCalled()
  })

  it('returns false and warns when SMTP config is incomplete', async () => {
    delete process.env.EMAIL_SERVER_PASSWORD

    const result = await sendInvoiceEmail(buildPayment())

    expect(result).toBe(false)
    expect(sendMailMock).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledWith(
      '[invoice-email] SMTP configuration is incomplete.',
      expect.objectContaining({
        missingEnvVars: ['EMAIL_SERVER_PASSWORD'],
      })
    )
  })

  it('sends to the real recipient addresses, trimmed and de-duplicated', async () => {
    const result = await sendInvoiceEmail(
      buildPayment({
        reciever: {
          companyName: 'Acme',
          adminEmails: [' a@real.com ', 'a@real.com', '', 'b@real.com'],
          description: '',
        },
      })
    )

    expect(result).toBe(true)
    expect(sendMailMock).toHaveBeenCalledTimes(1)
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'billing@example.com',
        to: 'a@real.com, b@real.com',
        subject: 'Invoice INV-101 for Acme',
      })
    )
  })

  it('infers a secure connection from port 465', async () => {
    process.env.EMAIL_SERVER_PORT = '465'

    await sendInvoiceEmail(buildPayment())

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        auth: { user: 'smtp-user', pass: 'smtp-pass' },
      })
    )
  })

  it('honours an explicit EMAIL_SERVER_SECURE override on a non-465 port', async () => {
    process.env.EMAIL_SERVER_PORT = '587'
    process.env.EMAIL_SERVER_SECURE = 'true'

    await sendInvoiceEmail(buildPayment())

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587, secure: true })
    )
  })

  it('falls back to EMAIL_SERVER_USER as sender when EMAIL_FROM is unset', async () => {
    delete process.env.EMAIL_FROM

    await sendInvoiceEmail(buildPayment())

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'smtp-user' })
    )
  })

  it('renders the supplied html and attaches it as a PDF', async () => {
    const result = await sendInvoiceEmail(buildPayment(), {
      html: '<html>invoice</html>',
    })

    expect(result).toBe(true)
    expect(generatePdfFromHtmlMock).toHaveBeenCalledWith('<html>invoice</html>')
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Invoice INV-101 is attached to this email.',
        attachments: [
          {
            filename: 'Acme-inv-101.pdf',
            content: expect.any(Buffer),
            contentType: 'application/pdf',
          },
        ],
      })
    )
  })

  it('sends a plain notification with no attachment when html is absent', async () => {
    await sendInvoiceEmail(buildPayment())

    expect(generatePdfFromHtmlMock).not.toHaveBeenCalled()
    const sent = sendMailMock.mock.calls[0][0]
    expect(sent.text).toBe('Invoice INV-101 notification.')
    expect(sent.attachments).toBeUndefined()
  })

  it('does not send at all when the PDF render fails', async () => {
    generatePdfFromHtmlMock.mockRejectedValue(new Error('chromium missing'))

    await expect(
      sendInvoiceEmail(buildPayment(), { html: '<html>invoice</html>' })
    ).rejects.toThrow('chromium missing')
    expect(sendMailMock).not.toHaveBeenCalled()
  })

  it('omits replyTo and the configuration set header when unset', async () => {
    await sendInvoiceEmail(buildPayment())

    const sent = sendMailMock.mock.calls[0][0]
    expect(sent).not.toHaveProperty('replyTo')
    expect(sent).not.toHaveProperty('headers')
  })

  it('sets replyTo and the SES configuration set header when configured', async () => {
    process.env.EMAIL_REPLY_TO = ' support@example.com '
    process.env.EMAIL_CONFIGURATION_SET = ' invoices '

    await sendInvoiceEmail(buildPayment())

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: 'support@example.com',
        headers: { 'X-SES-CONFIGURATION-SET': 'invoices' },
      })
    )
  })

  it('warns about rejected recipients even though sendMail resolved', async () => {
    sendMailMock.mockResolvedValue({
      messageId: 'mid-2',
      accepted: ['client@real.com'],
      rejected: ['blocked@real.com'],
      response: '250 OK',
    })

    const result = await sendInvoiceEmail(buildPayment())

    expect(result).toBe(true)
    expect(console.warn).toHaveBeenCalledWith(
      '[invoice-email] recipients_rejected',
      expect.objectContaining({
        rejected: ['bl***@real.com'],
        accepted: 1,
        messageId: 'mid-2',
      })
    )
  })

  it('propagates the error when sendMail fails', async () => {
    sendMailMock.mockRejectedValue(new Error('smtp down'))

    await expect(sendInvoiceEmail(buildPayment())).rejects.toThrow('smtp down')
    expect(console.error).toHaveBeenCalledWith(
      '[invoice-email] sendMail_failed',
      expect.objectContaining({ message: 'smtp down' })
    )
  })
})
