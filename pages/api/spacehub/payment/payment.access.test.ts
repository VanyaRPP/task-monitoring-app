import { expect } from '@jest/globals'
import mongoose from 'mongoose'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, users } from '@utils/testData'
import Payment from '@modules/models/Payment'
import PaymentChangeLog from '@modules/models/PaymentChangeLog'
import { logPaymentMutation } from '@common/modules/services/paymentAudit'
import { generatePdfFromHtml } from '@utils/pdf/bufferGenerators'
import paymentsHandler from '.'
import paymentHandler from './[id]'
import changeLogHandler from './[id]/change-log'
import htmlToPdfHandler from './htmlToPdf'
import htmlToPdfZipHandler from './htmlToPdfZip'
import generateExcelHandler from './generateExcel'
import catalogHandler from '@pages/api/custom-services/domain'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('@utils/dbConnect', () => jest.fn())
jest.mock('@utils/email/sendInvoiceEmail', () => ({
  sendInvoiceEmail: jest.fn().mockResolvedValue(true),
}))
jest.mock('@common/modules/services/paymentAudit', () => ({
  logPaymentMutation: jest.fn(),
}))
jest.mock('@utils/pdf/bufferGenerators', () => ({
  generatePdfFromHtml: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  generateZipFromHtmls: jest.fn().mockResolvedValue(Buffer.from('zip')),
}))

setupTestEnvironment()

// domainAdmin runs domains[0]; realEstates[0] is a company of domains[0]
// owned by `users.user`; realEstates[1] belongs to domains[1].
const ownDomain = domains[0]._id
const foreignDomain = domains[1]._id
const ownCompany = realEstates[0]._id
const foreignCompany = realEstates[1]._id

type Who = { email: string; roles: any[] } | null

async function call(
  handler: (req: any, res: any) => Promise<unknown>,
  who: Who,
  req: Record<string, unknown>
) {
  if (who) await mockLoginAs(who)
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  res.send = jest.fn(() => res)
  res.end = jest.fn(() => res)
  res.setHeader = jest.fn()
  await handler({ query: {}, body: {}, ...req }, res)
  return {
    status: res.status.mock.lastCall?.[0],
    body: res.json.mock.lastCall?.[0],
  }
}

const invoiceIn = (domain: string, company: string) => ({
  invoiceNumber: 7000,
  type: 'credit',
  domain,
  company,
  invoiceCreationDate: new Date(),
  description: 'test',
  generalSum: 100,
  invoice: [],
  provider: { description: 'p' },
  reciever: { companyName: 'c', adminEmails: [], description: '' },
})

const addPayment = (domain: string, company: string) =>
  Payment.create(invoiceIn(domain, company))

describe('Payment access', () => {
  describe('POST /api/spacehub/payment', () => {
    it('200 into their own domain and company', async () => {
      const { status } = await call(paymentsHandler, users.domainAdmin, {
        method: 'POST',
        body: invoiceIn(ownDomain, ownCompany),
      })
      expect(status).toBe(200)
    })

    it('403 into a foreign domain, and nothing is written', async () => {
      const before = await Payment.countDocuments()

      const { status } = await call(paymentsHandler, users.domainAdmin, {
        method: 'POST',
        body: invoiceIn(foreignDomain, foreignCompany),
      })

      expect(status).toBe(403)
      expect(await Payment.countDocuments()).toBe(before)
    })

    it("403 for another domain's company under their own domain", async () => {
      const { status } = await call(paymentsHandler, users.domainAdmin, {
        method: 'POST',
        body: invoiceIn(ownDomain, foreignCompany),
      })
      expect(status).toBe(403)
    })

    it('200 anywhere for a GlobalAdmin', async () => {
      const { status } = await call(paymentsHandler, users.globalAdmin, {
        method: 'POST',
        body: invoiceIn(foreignDomain, foreignCompany),
      })
      expect(status).toBe(200)
    })
  })

  describe('/api/spacehub/payment/[id]', () => {
    it('PATCH of only the template is 403 on a foreign payment', async () => {
      const foreign = await addPayment(foreignDomain, foreignCompany)

      const { status } = await call(paymentHandler, users.domainAdmin, {
        method: 'PATCH',
        query: { id: foreign._id.toString() },
        body: { template: 'olimp' },
      })

      expect(status).toBe(403)
      expect((await Payment.findById(foreign._id).lean()).template).not.toBe(
        'olimp'
      )
    })

    it('PATCH of only the template is 200 on their own payment', async () => {
      const own = await addPayment(ownDomain, ownCompany)

      const { status } = await call(paymentHandler, users.domainAdmin, {
        method: 'PATCH',
        query: { id: own._id.toString() },
        body: { template: 'olimp' },
      })

      expect(status).toBe(200)
      expect((await Payment.findById(own._id).lean()).template).toBe('olimp')
    })

    it('DELETE writes one audit entry, not two', async () => {
      const own = await addPayment(ownDomain, ownCompany)
      ;(logPaymentMutation as jest.Mock).mockClear()

      const { status } = await call(paymentHandler, users.domainAdmin, {
        method: 'DELETE',
        query: { id: own._id.toString() },
      })

      expect(status).toBe(200)
      expect(logPaymentMutation).toHaveBeenCalledTimes(1)
    })
  })

  describe('/api/spacehub/payment/[id]/change-log', () => {
    const logFor = (paymentId: unknown) =>
      PaymentChangeLog.create({
        paymentId,
        invoiceData: invoiceIn(ownDomain, ownCompany),
        actionType: 'UPDATE',
        source: 'single',
        reason: 'manual',
      })

    it.each(['GET', 'POST', 'DELETE'])(
      '%s 401 without a session',
      async (method) => {
        const own = await addPayment(ownDomain, ownCompany)

        const { status } = await call(changeLogHandler, null, {
          method,
          query: { id: own._id.toString() },
          body: { invoiceData: {} },
        })

        expect(status).toBe(401)
      }
    )

    it('GET 403 for a foreign payment', async () => {
      const foreign = await addPayment(foreignDomain, foreignCompany)
      await logFor(foreign._id)

      const { status } = await call(changeLogHandler, users.domainAdmin, {
        method: 'GET',
        query: { id: foreign._id.toString() },
      })

      expect(status).toBe(403)
    })

    it('DELETE 403 for a foreign payment, and the log stays', async () => {
      const foreign = await addPayment(foreignDomain, foreignCompany)
      const log = await logFor(foreign._id)

      const { status } = await call(changeLogHandler, users.domainAdmin, {
        method: 'DELETE',
        query: {
          id: foreign._id.toString(),
          changeLogId: log._id.toString(),
        },
      })

      expect(status).toBe(403)
      expect(await PaymentChangeLog.exists({ _id: log._id })).toBeTruthy()
    })

    it('POST records the signed-in author', async () => {
      const own = await addPayment(ownDomain, ownCompany)

      const { status, body } = await call(changeLogHandler, users.domainAdmin, {
        method: 'POST',
        query: { id: own._id.toString() },
        body: { invoiceData: invoiceIn(ownDomain, ownCompany) },
      })

      expect(status).toBe(201)
      expect(body.data.actorEmail).toBe(users.domainAdmin.email)
    })

    it('the company owner may read the history of their invoice, not edit it', async () => {
      const own = await addPayment(ownDomain, ownCompany)

      const read = await call(changeLogHandler, users.user, {
        method: 'GET',
        query: { id: own._id.toString() },
      })
      const write = await call(changeLogHandler, users.user, {
        method: 'POST',
        query: { id: own._id.toString() },
        body: { invoiceData: {} },
      })

      expect(read.status).toBe(200)
      expect(write.status).toBe(403)
    })

    it('403, not 404, for a payment that does not exist', async () => {
      const { status } = await call(changeLogHandler, users.domainAdmin, {
        method: 'GET',
        query: { id: new mongoose.Types.ObjectId().toString() },
      })
      expect(status).toBe(403)
    })
  })

  describe('file building needs a session', () => {
    it('htmlToPdf: 401 and no Chrome run without one', async () => {
      const { status } = await call(htmlToPdfHandler, null, {
        method: 'POST',
        body: { html: '<p>x</p>' },
      })

      expect(status).toBe(401)
      expect(generatePdfFromHtml).not.toHaveBeenCalled()
    })

    it('htmlToPdf: works for a signed-in company owner', async () => {
      const { status } = await call(htmlToPdfHandler, users.user, {
        method: 'POST',
        body: { html: '<p>x</p>' },
      })
      expect(status).not.toBe(401)
      expect(generatePdfFromHtml).toHaveBeenCalled()
    })

    it.each([
      [
        'htmlToPdfZip',
        htmlToPdfZipHandler,
        { items: [{ html: 'x', fileName: 'a' }] },
      ],
      ['generateExcel', generateExcelHandler, { payments: [{}] }],
    ])('%s: 401 without one', async (_name, handler, body) => {
      const { status } = await call(handler as any, null, {
        method: 'POST',
        body,
      })
      expect(status).toBe(401)
    })
  })

  describe('GET /api/custom-services/domain', () => {
    it('200 for an admin of the domain', async () => {
      const { status } = await call(catalogHandler, users.domainAdmin, {
        method: 'GET',
        query: { domainId: ownDomain },
      })
      expect(status).toBe(200)
    })

    it('200 for the owner of a company in the domain', async () => {
      const { status } = await call(catalogHandler, users.user, {
        method: 'GET',
        query: { domainId: ownDomain },
      })
      expect(status).toBe(200)
    })

    it('403 for a domain they have nothing to do with', async () => {
      const { status } = await call(catalogHandler, users.domainAdmin, {
        method: 'GET',
        // domainAdmin owns a company in domains[2], so that one is theirs.
        query: { domainId: foreignDomain },
      })
      expect(status).toBe(403)
    })
  })
})
