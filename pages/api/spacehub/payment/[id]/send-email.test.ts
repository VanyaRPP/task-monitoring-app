import { expect } from '@jest/globals'
import handler from './send-email'
import Payment from '@common/modules/models/Payment'
import { getCurrentUser } from '@utils/getCurrentUser'
import { sendInvoiceEmail } from '@utils/email/sendInvoiceEmail'

jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('@common/modules/models/Payment', () => ({
  __esModule: true,
  default: { findById: jest.fn(), updateOne: jest.fn() },
}))
jest.mock('@utils/getCurrentUser', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@utils/email/sendInvoiceEmail', () => ({
  sendInvoiceEmail: jest.fn(),
}))

const findByIdMock = Payment.findById as jest.Mock
const updateOneMock = Payment.updateOne as jest.Mock
const getCurrentUserMock = getCurrentUser as jest.Mock
const sendInvoiceEmailMock = sendInvoiceEmail as jest.Mock

// findById is awaited after a `.populate()` chain, so the result must be a
// thenable that also answers `.populate()` with itself.
const mockFindById = (payment: unknown) => {
  const chain: any = {
    populate: jest.fn(() => chain),
    then: (resolve: (value: unknown) => void) => resolve(payment),
  }
  findByIdMock.mockReturnValue(chain)
}

const globalAdmin = {
  isGlobalAdmin: true,
  isDomainAdmin: false,
  isUser: false,
  user: { email: 'admin@test.com' },
}

const performRequest = async (
  method: string,
  query: any,
  payment?: unknown,
  body: any = {}
) => {
  if (payment !== undefined) mockFindById(payment)

  const req = { method, query, body } as any
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(() => res),
  } as any

  await handler(req, res)
  return res
}

beforeEach(() => {
  jest.clearAllMocks()
  getCurrentUserMock.mockResolvedValue(globalAdmin)
  sendInvoiceEmailMock.mockResolvedValue(true)
})

describe('POST /spacehub/payment/[id]/send-email', () => {
  it('returns 401 when the user is unauthorized', async () => {
    getCurrentUserMock.mockRejectedValue(new Error('unauthorized'))
    const res = await performRequest('POST', { id: 'p1' })
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('returns 405 for non-POST methods', async () => {
    const res = await performRequest('GET', { id: 'p1' })
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 404 when the payment does not exist', async () => {
    const res = await performRequest('POST', { id: 'missing' }, null)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(sendInvoiceEmailMock).not.toHaveBeenCalled()
  })

  it('sends to the stored receiver admin emails', async () => {
    const res = await performRequest(
      'POST',
      { id: 'p1' },
      {
        invoiceNumber: 5,
        reciever: { companyName: 'Acme', adminEmails: ['client@real.com'] },
        domain: { name: 'D', adminEmails: ['domain@real.com'] },
      }
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(sendInvoiceEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reciever: expect.objectContaining({
          adminEmails: ['client@real.com'],
        }),
      }),
      { html: undefined }
    )
  })

  it('forwards the client-rendered html so the PDF gets attached', async () => {
    const res = await performRequest(
      'POST',
      { id: 'p1' },
      {
        invoiceNumber: 5,
        reciever: { companyName: 'Acme', adminEmails: ['client@real.com'] },
        domain: { name: 'D', adminEmails: [] },
      },
      { html: '<html>invoice</html>' }
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(sendInvoiceEmailMock).toHaveBeenCalledWith(expect.any(Object), {
      html: '<html>invoice</html>',
    })
  })

  it('returns 400 when html is not a string', async () => {
    const res = await performRequest(
      'POST',
      { id: 'p1' },
      {
        invoiceNumber: 5,
        reciever: { companyName: 'Acme', adminEmails: ['client@real.com'] },
        domain: { name: 'D', adminEmails: [] },
      },
      { html: 42 }
    )

    expect(res.status).toHaveBeenCalledWith(400)
    expect(sendInvoiceEmailMock).not.toHaveBeenCalled()
  })

  it('falls back to domain admins when the receiver has no recipients', async () => {
    const res = await performRequest(
      'POST',
      { id: 'p1' },
      {
        invoiceNumber: 5,
        reciever: { companyName: 'Acme', adminEmails: [] },
        domain: { name: 'Domain', adminEmails: ['domain@real.com'] },
      }
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(sendInvoiceEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reciever: expect.objectContaining({
          adminEmails: ['domain@real.com'],
        }),
      }),
      { html: undefined }
    )
  })

  it('sends to the company admins when the receiver has no recipients', async () => {
    const res = await performRequest(
      'POST',
      { id: 'p1' },
      {
        invoiceNumber: 6,
        reciever: { companyName: 'Acme', description: 'Acme LLC' },
        company: { adminEmails: ['owner@real.com'] },
        domain: { name: 'Domain', adminEmails: ['domain@real.com'] },
      }
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(sendInvoiceEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reciever: expect.objectContaining({
          adminEmails: ['owner@real.com'],
        }),
      }),
      { html: undefined }
    )
  })

  it('returns 400 when no recipients exist anywhere', async () => {
    sendInvoiceEmailMock.mockResolvedValue(false)
    const res = await performRequest(
      'POST',
      { id: 'p1' },
      {
        invoiceNumber: 5,
        reciever: { adminEmails: [] },
        domain: { adminEmails: [] },
      }
    )

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 403 when a plain user does not own the payment company', async () => {
    getCurrentUserMock.mockResolvedValue({
      isGlobalAdmin: false,
      isDomainAdmin: false,
      isUser: true,
      user: { email: 'stranger@test.com' },
    })

    const res = await performRequest(
      'POST',
      { id: 'p1' },
      {
        invoiceNumber: 5,
        reciever: { adminEmails: ['client@real.com'] },
        company: { adminEmails: ['owner@real.com'] },
        domain: { adminEmails: [] },
      }
    )

    expect(res.status).toHaveBeenCalledWith(403)
    expect(sendInvoiceEmailMock).not.toHaveBeenCalled()
  })

  describe('status', () => {
    const draft = {
      _id: 'p1',
      invoiceNumber: 5,
      status: 'draft',
      reciever: { companyName: 'Acme', adminEmails: ['client@real.com'] },
      company: { adminEmails: ['owner@real.com'] },
      domain: { name: 'D', adminEmails: ['domain@real.com'] },
    }

    it('marks the invoice as sent once the email has gone out', async () => {
      const res = await performRequest('POST', { id: 'p1' }, draft)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(updateOneMock).toHaveBeenCalledWith(
        { _id: 'p1' },
        { $set: { status: 'sent' } }
      )
    })

    it('leaves the invoice a draft when the email was not sent', async () => {
      sendInvoiceEmailMock.mockResolvedValue(false)

      const res = await performRequest('POST', { id: 'p1' }, draft)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(updateOneMock).not.toHaveBeenCalled()
    })

    it('leaves the invoice a draft when sending throws', async () => {
      sendInvoiceEmailMock.mockRejectedValue(new Error('smtp down'))

      const res = await performRequest('POST', { id: 'p1' }, draft)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(updateOneMock).not.toHaveBeenCalled()
    })

    it('a company owner emailing their own invoice does not change its status', async () => {
      getCurrentUserMock.mockResolvedValue({
        isGlobalAdmin: false,
        isDomainAdmin: false,
        isUser: true,
        user: { email: 'owner@real.com' },
      })

      const res = await performRequest('POST', { id: 'p1' }, draft)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(sendInvoiceEmailMock).toHaveBeenCalled()
      expect(updateOneMock).not.toHaveBeenCalled()
    })

    it('an admin of the invoice domain marks it as sent too', async () => {
      getCurrentUserMock.mockResolvedValue({
        isGlobalAdmin: false,
        isDomainAdmin: true,
        isUser: false,
        user: { email: 'domain@real.com' },
      })

      const res = await performRequest('POST', { id: 'p1' }, draft)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(updateOneMock).toHaveBeenCalledTimes(1)
    })
  })
})
