import { buildAssistantTools } from './index'
import { buildCompanyDraft } from '@common/services/aiAssistant/companyActions'
import type { UserContext } from '@common/services/paymentService/payment.service'

// The real `ai` package pulls in Web Streams at import; only `tool()` matters.
jest.mock('ai', () => ({ tool: (def: unknown) => def }))
jest.mock('@common/services/aiAssistant/companyActions', () => ({
  buildCompanyDraft: jest.fn(),
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

const mockBuild = buildCompanyDraft as jest.Mock

const ctx: UserContext = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: 'admin@example.com' },
}

describe('previewCompany tool', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBuild.mockResolvedValue({
      draft: { domain: 'dom-1', companyName: 'ТОВ Ромашка', description: '' },
      domainName: 'ОСББ',
      streetAddress: null,
      unmatched: [],
      invalidEmails: ['x'],
      similar: ['ТОВ Ромашка'],
    })
  })

  it('returns the draft for the form and what the reply should mention', async () => {
    const result = await (
      buildAssistantTools(ctx) as any
    ).previewCompany.execute(
      { domainId: 'dom-1', companyName: 'ТОВ Ромашка' },
      {}
    )

    expect(result.draft).toEqual({
      domain: 'dom-1',
      companyName: 'ТОВ Ромашка',
      description: '',
    })
    expect(result.summary).toEqual({
      companyName: 'ТОВ Ромашка',
      domain: 'ОСББ',
      street: null,
      missingDescription: true,
      unmatched: [],
      invalidEmails: ['x'],
      similar: ['ТОВ Ромашка'],
    })
    expect(mockBuild.mock.calls[0][0].ctx).toBe(ctx)
  })
})
