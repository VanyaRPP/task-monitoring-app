import { buildAssistantTools } from './index'
import { buildStreetDraft } from '@common/services/aiAssistant/streetActions'
import type { UserContext } from '@common/services/paymentService/payment.service'

// The real `ai` package pulls in Web Streams at import; only `tool()` matters.
jest.mock('ai', () => ({ tool: (def: unknown) => def }))
jest.mock('@common/services/aiAssistant/streetActions', () => ({
  buildStreetDraft: jest.fn(),
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

const mockBuild = buildStreetDraft as jest.Mock

const ctx: UserContext = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: 'admin@example.com' },
}

const draft = { domain: 'dom-1', address: 'вул. Шевченка, 5', city: 'Львів' }
const run = () =>
  (buildAssistantTools(ctx) as any).previewStreet.execute(
    { domainId: 'dom-1', address: 'вул. Шевченка, 5', city: 'Львів' },
    {}
  )

describe('previewStreet tool', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns the draft for the form and a summary', async () => {
    mockBuild.mockResolvedValue({ draft, domainName: 'ОСББ', existing: null })

    const result = await run()

    expect(result.draft).toEqual(draft)
    expect(result.summary).toEqual({
      address: 'вул. Шевченка, 5',
      city: 'Львів',
      domain: 'ОСББ',
      alreadyExists: false,
    })
    expect(mockBuild.mock.calls[0][0].ctx).toBe(ctx)
  })

  it('opens nothing for an address the domain already has', async () => {
    mockBuild.mockResolvedValue({
      draft,
      domainName: 'ОСББ',
      existing: { _id: 'st-1', address: 'вул. Шевченка, 5' },
    })

    const result = await run()

    expect(result.draft).toBeUndefined()
    expect(result.summary.alreadyExists).toBe(true)
  })
})
