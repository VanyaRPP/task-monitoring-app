import { buildAssistantTools } from './index'
import { buildInvoiceDraft } from '@common/services/aiAssistant/invoiceActions'
import { createPayment } from '@common/services/paymentService/payment.service'
import type { UserContext } from '@common/services/paymentService/payment.service'

// The real `ai` package pulls in Web Streams at import; only `tool()` matters.
jest.mock('ai', () => ({ tool: (def: unknown) => def }))
jest.mock('@common/services/aiAssistant/invoiceActions', () => ({
  buildInvoiceDraft: jest.fn(),
  findDomainsByName: jest.fn(),
  findCompaniesByName: jest.fn(),
}))
jest.mock('@common/services/paymentService/payment.service', () => ({
  createPayment: jest.fn(),
  getPayments: jest.fn(),
}))

const mockBuildDraft = buildInvoiceDraft as jest.Mock
const mockCreatePayment = createPayment as jest.Mock

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
  it('builds a draft but never writes a payment', async () => {
    const summary: any = await execOf('previewInvoice')(
      { companyId: 'co-1', month: 7, year: 2026 },
      {} as any
    )

    expect(mockBuildDraft).toHaveBeenCalledTimes(1)
    expect(mockCreatePayment).not.toHaveBeenCalled()
    expect(summary.generalSum).toBe(5300)
    expect(summary.company).toBe('Acme')
  })

  it('passes the bound userContext (not from the model) to the draft', async () => {
    await execOf('previewInvoice')({ companyId: 'co-1' }, {} as any)
    expect(mockBuildDraft.mock.calls[0][0].ctx).toBe(ctx)
  })
})

describe('createInvoice tool', () => {
  it('rebuilds the draft and creates the payment with email OFF', async () => {
    mockCreatePayment.mockResolvedValue({
      invoiceNumber: 101,
      id: 'pay-1',
      generalSum: 5300,
    })

    const result: any = await execOf('createInvoice')(
      { companyId: 'co-1', month: 7, year: 2026 },
      {} as any
    )

    // The payload comes from the deterministic rebuild, not from the model.
    expect(mockBuildDraft).toHaveBeenCalledTimes(1)
    expect(mockCreatePayment).toHaveBeenCalledWith(draft, true, {
      sendInvoiceEmail: false,
    })
    expect(result).toMatchObject({ created: true, invoiceNumber: 101 })
  })
})
