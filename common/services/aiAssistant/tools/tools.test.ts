import { buildAssistantTools } from './index'
import { getPayments } from '@common/services/paymentService/payment.service'
import type { UserContext } from '@common/services/paymentService/payment.service'

// The real `ai` package pulls in Web Streams (TransformStream) at import time,
// which isn't available in the jest environment. We only need `tool()` to
// return its definition unchanged, so a light mock is enough.
jest.mock('ai', () => ({
  tool: (definition: unknown) => definition,
}))

jest.mock('@common/services/paymentService/payment.service', () => ({
  getPayments: jest.fn(),
}))

const mockGetPayments = getPayments as jest.Mock

const userContext: UserContext = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: 'admin@example.com' },
}

// Tools declare `execute` as optional in the SDK's ToolSet type, so narrow it
// for the test rather than sprinkling non-null assertions.
function getExecute(tools: ReturnType<typeof buildAssistantTools>) {
  const execute = tools.getMyPayments.execute
  if (!execute) throw new Error('getMyPayments tool has no execute')
  return execute
}

describe('buildAssistantTools > getMyPayments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('passes the bound userContext to getPayments (never from the model)', async () => {
    mockGetPayments.mockResolvedValue({ total: 0, data: [] })

    const tools = buildAssistantTools(userContext)
    await getExecute(tools)({ limit: 3 }, {} as any)

    expect(mockGetPayments).toHaveBeenCalledTimes(1)
    const [, passedContext] = mockGetPayments.mock.calls[0]
    expect(passedContext).toBe(userContext)
  })

  it('applies the requested limit and type to the query', async () => {
    mockGetPayments.mockResolvedValue({ total: 0, data: [] })

    const tools = buildAssistantTools(userContext)
    await getExecute(tools)({ limit: 7, type: 'debit' }, {} as any)

    const [query] = mockGetPayments.mock.calls[0]
    expect(query).toEqual({ limit: '7', skip: '0', type: 'debit' })
  })

  it('defaults to limit 5 when none is provided', async () => {
    mockGetPayments.mockResolvedValue({ total: 0, data: [] })

    const tools = buildAssistantTools(userContext)
    await getExecute(tools)({}, {} as any)

    const [query] = mockGetPayments.mock.calls[0]
    expect(query.limit).toBe('5')
  })

  it('returns a compact, model-friendly shape (not raw docs)', async () => {
    mockGetPayments.mockResolvedValue({
      total: 1,
      data: [
        {
          invoiceNumber: 42,
          type: 'debit',
          generalSum: 1500,
          invoiceCreationDate: new Date('2026-01-01'),
          domain: { name: 'Domain A', secret: 'should-not-leak' },
          company: { companyName: 'Company B', secret: 'should-not-leak' },
        },
      ],
    })

    const tools = buildAssistantTools(userContext)
    const result: any = await getExecute(tools)({ limit: 5 }, {} as any)

    expect(result.total).toBe(1)
    expect(result.payments).toEqual([
      {
        invoiceNumber: 42,
        type: 'debit',
        generalSum: 1500,
        date: new Date('2026-01-01'),
        domain: 'Domain A',
        company: 'Company B',
      },
    ])
    // The raw mongoose fields must not be forwarded to the model.
    expect(JSON.stringify(result)).not.toContain('should-not-leak')
  })
})
