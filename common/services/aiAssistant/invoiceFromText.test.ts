/**
 * @jest-environment node
 */
import { APICallError, generateText } from 'ai'
import { RateLimitedError } from '@common/services/aiAssistant/documents/extract'
import { buildPartiesInvoiceDraft } from '@common/services/aiAssistant/invoicePartiesActions'
import type { UserContext } from '@common/services/paymentService/payment.service'
import {
  buildInvoiceDraftFromText,
  NoServicesInTextError,
} from './invoiceFromText'

jest.mock('ai', () => ({
  ...jest.requireActual('ai'),
  generateText: jest.fn(),
}))
jest.mock('@common/services/aiAssistant/config', () => ({
  getModel: () => 'model',
}))
jest.mock('@common/services/aiAssistant/invoicePartiesActions', () => ({
  buildPartiesInvoiceDraft: jest.fn(),
}))

const generate = generateText as jest.MockedFunction<typeof generateText>
const buildDraft = buildPartiesInvoiceDraft as jest.MockedFunction<
  typeof buildPartiesInvoiceDraft
>

const ctx: UserContext = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: 'domainAdmin@example.com' },
}
const now = new Date(2026, 9, 15)
const draft = { type: 'debit', company: 'c1' } as any

const agentCalls = (input: unknown) =>
  ({ toolCalls: [{ toolName: 'previewInvoice', input }] }) as any

const params = (text = 'вересень - оренда 5000') => ({
  text,
  companyId: 'c1',
  domainId: 'd1',
  ctx,
  now,
})

describe('buildInvoiceDraftFromText', () => {
  beforeEach(() => {
    generate.mockReset()
    buildDraft.mockReset()
    buildDraft.mockResolvedValue({ draft } as any)
  })

  it('builds the draft for the picked company with the services from the text', async () => {
    generate.mockResolvedValueOnce(
      agentCalls({
        month: 9,
        year: 2026,
        extraLines: [{ name: 'Оренда', sum: 5000 }],
        onlyNamedLines: true,
      })
    )

    await expect(buildInvoiceDraftFromText(params())).resolves.toBe(draft)
    expect(buildDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'c1',
        domainId: 'd1',
        month: 9,
        year: 2026,
        lines: [{ name: 'Оренда', sum: 5000 }],
        onlyNamedLines: true,
        ctx,
      })
    )
  })

  it('bills the picked company even if the model names another one', async () => {
    generate.mockResolvedValueOnce(
      agentCalls({
        companyName: 'Інша компанія',
        companyId: 'someone-else',
        extraLines: [{ name: 'Оренда', sum: 5000 }],
      })
    )

    await buildInvoiceDraftFromText(params())

    const args = buildDraft.mock.calls[0][0]
    expect(args.companyId).toBe('c1')
    expect(args).not.toHaveProperty('companyName')
  })

  it('takes the current month when the text names none', async () => {
    generate.mockResolvedValueOnce(
      agentCalls({ extraLines: [{ name: 'Оренда', sum: 5000 }] })
    )

    await buildInvoiceDraftFromText(params('оренда 5000'))

    expect(buildDraft).toHaveBeenCalledWith(
      expect.objectContaining({ month: 10, year: 2026 })
    )
  })

  it('reports a text without services instead of opening an empty invoice', async () => {
    generate.mockResolvedValueOnce(agentCalls({ extraLines: [] }))

    await expect(
      buildInvoiceDraftFromText(params('привіт'))
    ).rejects.toBeInstanceOf(NoServicesInTextError)
    expect(buildDraft).not.toHaveBeenCalled()
  })

  it('turns a provider rate limit into RateLimitedError with its wait', async () => {
    generate.mockRejectedValueOnce(
      new APICallError({
        message: 'Too Many Requests',
        url: 'https://api.example.com',
        requestBodyValues: {},
        statusCode: 429,
        responseHeaders: { 'retry-after': '12' },
      })
    )

    const error = await buildInvoiceDraftFromText(params()).catch((e) => e)

    expect(error).toBeInstanceOf(RateLimitedError)
    expect(error.retryAfter).toBe(12)
  })
})
