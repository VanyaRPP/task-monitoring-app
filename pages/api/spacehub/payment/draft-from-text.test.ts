/**
 * @jest-environment node
 */
import { expect } from '@jest/globals'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { users } from '@utils/testData'
import {
  buildInvoiceDraftFromText,
  NoServicesInTextError,
} from '@common/services/aiAssistant/invoiceFromText'
import { RateLimitedError } from '@common/services/aiAssistant/documents/extract'
import handler from './draft-from-text'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())
// The AI agent is the external boundary.
jest.mock('@common/services/aiAssistant/invoiceFromText', () => ({
  ...jest.requireActual('@common/services/aiAssistant/invoiceFromText'),
  buildInvoiceDraftFromText: jest.fn(),
}))

setupTestEnvironment()

const buildDraft = buildInvoiceDraftFromText as jest.MockedFunction<
  typeof buildInvoiceDraftFromText
>

const COMPANY_ID = '64b000000000000000000001'
const DOMAIN_ID = '64b000000000000000000002'

function createMockRes() {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn()
  res.setHeader = jest.fn()
  return res
}

const post = (body: Record<string, unknown>) =>
  ({
    method: 'POST',
    body: {
      text: 'вересень - оренда 5000',
      companyId: COMPANY_ID,
      domainId: DOMAIN_ID,
      ...body,
    },
  }) as any

describe('POST /api/spacehub/payment/draft-from-text', () => {
  beforeEach(() => buildDraft.mockReset())

  it('rejects other methods with 405', async () => {
    const res = createMockRes()
    await handler({ method: 'GET' } as any, res)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 403 for a user who is not an admin, without calling the agent', async () => {
    await mockLoginAs(users.user)
    const res = createMockRes()

    await handler(post({}), res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(buildDraft).not.toHaveBeenCalled()
  })

  describe('as an admin', () => {
    beforeEach(async () => {
      await mockLoginAs(users.domainAdmin)
    })

    it('returns 400 when the company or provider is not picked', async () => {
      const res = createMockRes()
      await handler(post({ companyId: '' }), res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(buildDraft).not.toHaveBeenCalled()
    })

    it('returns 400 for empty text', async () => {
      const res = createMockRes()
      await handler(post({ text: '   ' }), res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(buildDraft).not.toHaveBeenCalled()
    })

    it('returns 400 for text longer than 4000 characters', async () => {
      const res = createMockRes()
      await handler(post({ text: 'а'.repeat(4001) }), res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(buildDraft).not.toHaveBeenCalled()
    })

    it('returns the draft for the picked company, built with the caller rights', async () => {
      const draft = { type: 'debit', company: COMPANY_ID } as any
      buildDraft.mockResolvedValueOnce(draft)
      const res = createMockRes()

      await handler(post({ text: '  вересень - оренда 5000  ' }), res)

      expect(buildDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'вересень - оренда 5000',
          companyId: COMPANY_ID,
          domainId: DOMAIN_ID,
          ctx: expect.objectContaining({
            user: { email: users.domainAdmin.email },
          }),
        })
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { draft } })
    })

    it('returns 422 when the text has no services', async () => {
      buildDraft.mockRejectedValueOnce(new NoServicesInTextError())
      const res = createMockRes()

      await handler(post({}), res)

      expect(res.status).toHaveBeenCalledWith(422)
    })

    it('returns 403 for a company the admin cannot bill', async () => {
      buildDraft.mockRejectedValueOnce(new Error('company not accessible'))
      const res = createMockRes()

      await handler(post({}), res)

      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('passes the wait on to the browser when the AI is rate limited', async () => {
      buildDraft.mockRejectedValueOnce(new RateLimitedError(12))
      const res = createMockRes()

      await handler(post({}), res)

      expect(res.status).toHaveBeenCalledWith(429)
      expect(res.setHeader).toHaveBeenCalledWith('Retry-After', '12')
    })
  })
})
