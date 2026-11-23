import { buildAssistantTools } from './index'
import { buildDomainDraft } from '@common/services/aiAssistant/domainActions'
import type { UserContext } from '@common/services/paymentService/payment.service'

// The real `ai` package pulls in Web Streams at import; only `tool()` matters.
jest.mock('ai', () => ({ tool: (def: unknown) => def }))
jest.mock('@common/services/aiAssistant/domainActions', () => ({
  buildDomainDraft: jest.fn(),
}))
jest.mock('@common/services/aiAssistant/invoiceActions', () => ({
  buildCreditDraft: jest.fn(),
  buildInvoiceDraft: jest.fn(),
  findDomainsByName: jest.fn(),
  findCompaniesByName: jest.fn(),
}))
jest.mock('@common/services/paymentService/payment.service', () => ({
  getPayments: jest.fn(),
}))

const mockBuild = buildDomainDraft as jest.Mock

const ctx: UserContext = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: 'admin@example.com' },
}

const draft = {
  name: 'ОСББ Сонячне',
  adminEmails: ['admin@example.com'],
  description: '',
}

describe('previewDomain tool', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns the draft for the form and what the reply should mention', async () => {
    mockBuild.mockResolvedValue({
      draft,
      invalid: ['iban'],
      invalidEmails: ['x'],
      similar: ['ОСББ Сонячне'],
    })

    const result = await (
      buildAssistantTools(ctx) as any
    ).previewDomain.execute({ name: 'ОСББ Сонячне', iban: 'UA00' }, {})

    expect(result.draft).toEqual(draft)
    expect(result.summary).toEqual({
      name: 'ОСББ Сонячне',
      hasIban: false,
      invalid: ['iban'],
      invalidEmails: ['x'],
      similar: ['ОСББ Сонячне'],
    })
    expect(mockBuild.mock.calls[0][0].ctx).toBe(ctx)
  })

  it('takes no bank token', () => {
    const shape = (buildAssistantTools(ctx) as any).previewDomain.inputSchema
      .shape
    expect(Object.keys(shape)).not.toContain('domainBankToken')
  })
})
