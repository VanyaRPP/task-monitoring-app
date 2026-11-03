import { buildAssistantTools } from './index'
import { buildExpenseDraft } from '@common/services/aiAssistant/expenseActions'
import type { UserContext } from '@common/services/paymentService/payment.service'

// The real `ai` package pulls in Web Streams at import; only `tool()` matters.
jest.mock('ai', () => ({ tool: (def: unknown) => def }))
jest.mock('@common/services/aiAssistant/expenseActions', () => ({
  buildExpenseDraft: jest.fn(),
}))
jest.mock('@common/services/aiAssistant/invoiceActions', () => ({
  buildInvoiceDraft: jest.fn(),
  findDomainsByName: jest.fn(),
  findCompaniesByName: jest.fn(),
}))
jest.mock('@common/services/paymentService/payment.service', () => ({
  getPayments: jest.fn(),
}))

const mockBuildDraft = buildExpenseDraft as jest.Mock

const ctx: UserContext = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: 'admin@example.com' },
}

const draft = {
  type: 'debit',
  scope: { type: 'domain', id: 'dom-1', label: 'ОСББ' },
  currency: 'UAH',
  items: [
    { category: 'Прибирання', amount: 2600 },
    { category: 'Матеріали', amount: 500.15 },
  ],
}

const execute = (input: Record<string, unknown>) =>
  (buildAssistantTools(ctx) as any).previewExpenses.execute(input, {})

beforeEach(() => {
  jest.clearAllMocks()
  mockBuildDraft.mockResolvedValue({ draft, warnings: ['перевір'] })
})

describe('previewExpenses tool', () => {
  it('returns the draft for the form and a short summary for the reply', async () => {
    const result = await execute({ type: 'debit', items: draft.items })

    expect(result.draft).toBe(draft)
    expect(result.summary).toEqual({
      type: 'debit',
      target: 'ОСББ',
      lines: 2,
      total: 3100.15,
      currency: 'UAH',
    })
    expect(result.warnings).toEqual(['перевір'])
  })

  it('binds the session user, whatever the model sends', async () => {
    await execute({ type: 'debit', items: draft.items, ctx: { evil: true } })

    expect(mockBuildDraft.mock.calls[0][0].ctx).toBe(ctx)
  })

  it('reads a minus as an expense when the model leaves the type out', () => {
    const schema = (buildAssistantTools(ctx) as any).previewExpenses.inputSchema
    const parsed = schema.parse({ items: [{ amount: 300 }] })

    expect(parsed.type).toBe('debit')
  })
})
