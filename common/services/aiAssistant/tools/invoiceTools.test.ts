import { buildAssistantTools } from './index'
import { buildInvoiceDraft } from '@common/services/aiAssistant/invoiceActions'
import type { UserContext } from '@common/services/paymentService/payment.service'

// The real `ai` package pulls in Web Streams at import; only `tool()` matters.
jest.mock('ai', () => ({ tool: (def: unknown) => def }))
jest.mock('@common/services/aiAssistant/invoiceActions', () => ({
  buildInvoiceDraft: jest.fn(),
  findDomainsByName: jest.fn(),
  findCompaniesByName: jest.fn(),
}))
jest.mock('@common/services/paymentService/payment.service', () => ({
  getPayments: jest.fn(),
}))

const mockBuildDraft = buildInvoiceDraft as jest.Mock

const ctx: UserContext = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: 'admin@example.com' },
}

function execOf(name: string) {
  const tools = buildAssistantTools(ctx) as any
  const execute = tools[name].execute
  if (!execute) throw new Error(`${name} has no execute`)
  return execute
}

const draft = {
  invoiceNumber: 101,
  type: 'debit',
  company: 'co-1',
  monthService: 'svc-1',
  generalSum: 5300,
  currency: 'UAH',
  invoiceCreationDate: new Date('2026-07-01'),
  reciever: { companyName: 'Acme' },
  invoice: [{ name: 'Оренда', sum: 5300 }],
}

beforeEach(() => {
  jest.clearAllMocks()
  mockBuildDraft.mockResolvedValue(draft)
})

describe('previewInvoice tool', () => {
  it('returns the full draft (for the prefilled form) plus a text summary', async () => {
    const result: any = await execOf('previewInvoice')(
      { companyId: 'co-1', month: 7, year: 2026 },
      {} as any
    )

    // Full draft is what the frontend feeds into AddPaymentModal.
    expect(result.draft).toBe(draft)
    expect(result.draft.invoice).toEqual([{ name: 'Оренда', sum: 5300 }])
    expect(result.draft.company).toBe('co-1')
    expect(result.draft.monthService).toBe('svc-1')
    // Compact summary is for the model's reply.
    expect(result.summary.generalSum).toBe(5300)
    expect(result.summary.company).toBe('Acme')
  })

  it('passes the bound userContext (not from the model) to the draft', async () => {
    await execOf('previewInvoice')({ companyId: 'co-1' }, {} as any)
    expect(mockBuildDraft.mock.calls[0][0].ctx).toBe(ctx)
  })

  it('does not expose a createInvoice tool (form saving is user-driven)', () => {
    const tools = buildAssistantTools(ctx) as any
    expect(tools.createInvoice).toBeUndefined()
  })
})
