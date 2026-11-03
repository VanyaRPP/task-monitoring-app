import { buildAssistantTools } from './index'
import { buildServiceDraft } from '@common/services/aiAssistant/serviceActions'
import type { UserContext } from '@common/services/paymentService/payment.service'

// The real `ai` package pulls in Web Streams at import; only `tool()` matters.
jest.mock('ai', () => ({ tool: (def: unknown) => def }))
jest.mock('@common/services/aiAssistant/serviceActions', () => ({
  buildServiceDraft: jest.fn(),
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

const mockBuild = buildServiceDraft as jest.Mock

const ctx: UserContext = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: 'admin@example.com' },
}

const execute = (input: Record<string, unknown>) =>
  (buildAssistantTools(ctx) as any).previewService.execute(input, {})

beforeEach(() => {
  jest.clearAllMocks()
  mockBuild.mockResolvedValue({
    mode: 'create',
    service: { domain: { _id: 'dom-1', name: 'ОСББ' }, electricityPrice: 4.32 },
    lines: [
      {
        fieldName: 'electricityPrice',
        name: 'Електроенергія',
        price: 4.32,
        source: 'user',
      },
      {
        fieldName: 'waterPrice',
        name: 'Водопостачання',
        price: 30,
        source: 'previous',
      },
    ],
    unmatched: ['інтернет'],
    domainName: 'ОСББ',
    streetAddress: null,
  })
})

describe('previewService tool', () => {
  it('returns the draft for the form and a summary for the reply', async () => {
    const result = await execute({
      domainId: 'dom-1',
      month: 10,
      year: 2026,
      prices: [{ name: 'електрика', price: 4.32 }],
    })

    expect(result.draft).toEqual({
      mode: 'create',
      service: {
        domain: { _id: 'dom-1', name: 'ОСББ' },
        electricityPrice: 4.32,
      },
    })
    expect(result.summary).toEqual({
      mode: 'create',
      domain: 'ОСББ',
      street: null,
      tariffs: [
        { name: 'Електроенергія', price: 4.32, source: 'user' },
        { name: 'Водопостачання', price: 30, source: 'previous' },
      ],
      unmatched: ['інтернет'],
    })
  })

  it('binds the session user and defaults to the current month', async () => {
    await execute({ domainId: 'dom-1', prices: [{ name: 'вода', price: 1 }] })

    const params = mockBuild.mock.calls[0][0]
    expect(params.ctx).toBe(ctx)
    expect(params.month).toBe(new Date().getMonth() + 1)
    expect(params.year).toBe(new Date().getFullYear())
  })
})
