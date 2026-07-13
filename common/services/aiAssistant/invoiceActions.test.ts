import {
  buildInvoiceDraft,
  findDomainsByName,
  resolveMonthService,
} from './invoiceActions'
import RealEstate from '@modules/models/RealEstate'
import Domain from '@modules/models/Domain'
import Service from '@modules/models/Service'
import { getInvoices } from '@utils/getInvoices'
import {
  getNextInvoiceNumber,
  getPayments,
} from '@common/services/paymentService/payment.service'
import type { UserContext } from '@common/services/paymentService/payment.service'

jest.mock('@modules/models/RealEstate', () => ({
  __esModule: true,
  default: { find: jest.fn(), findById: jest.fn() },
}))
jest.mock('@modules/models/Domain', () => ({
  __esModule: true,
  default: { find: jest.fn(), distinct: jest.fn(), exists: jest.fn() },
}))
jest.mock('@modules/models/Service', () => ({
  __esModule: true,
  default: { findOne: jest.fn(), create: jest.fn() },
}))
jest.mock('@utils/getInvoices', () => ({ getInvoices: jest.fn() }))
jest.mock('@utils/helpers', () => ({
  getPaymentProviderAndReciever: jest.fn(() => ({
    provider: { description: 'domain desc' },
    reciever: { companyName: 'Acme', adminEmails: [], description: '' },
  })),
}))
jest.mock('@common/services/paymentService/payment.service', () => ({
  getNextInvoiceNumber: jest.fn(),
  getPayments: jest.fn(),
}))

const mockRealEstate = RealEstate as unknown as {
  find: jest.Mock
  findById: jest.Mock
}
const mockDomain = Domain as unknown as {
  find: jest.Mock
  distinct: jest.Mock
  exists: jest.Mock
}
const mockService = Service as unknown as {
  findOne: jest.Mock
  create: jest.Mock
}
const mockGetInvoices = getInvoices as jest.Mock
const mockGetNextInvoiceNumber = getNextInvoiceNumber as jest.Mock
const mockGetPayments = getPayments as jest.Mock

const globalAdmin: UserContext = {
  isUser: false,
  isDomainAdmin: false,
  isGlobalAdmin: true,
  user: { email: 'ga@example.com' },
}

const domainAdmin: UserContext = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: 'da@example.com' },
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetNextInvoiceNumber.mockResolvedValue(101)
  mockGetPayments.mockResolvedValue({ data: [] })
})

describe('findDomainsByName', () => {
  it('does not restrict by email for a global admin', async () => {
    mockDomain.find.mockReturnValue({ limit: () => [] })
    await findDomainsByName('acme', globalAdmin)

    const filter = mockDomain.find.mock.calls[0][0]
    expect(filter.adminEmails).toBeUndefined()
    expect(filter.name).toEqual({ $regex: 'acme', $options: 'i' })
  })

  it('restricts to the admin email for a domain admin', async () => {
    mockDomain.find.mockReturnValue({ limit: () => [] })
    await findDomainsByName('acme', domainAdmin)

    const filter = mockDomain.find.mock.calls[0][0]
    expect(filter.adminEmails).toBe('da@example.com')
  })
})

describe('resolveMonthService', () => {
  it('returns the existing Service when one is found', async () => {
    mockService.findOne.mockResolvedValue({ _id: 'svc-1' })
    const result = await resolveMonthService(
      'dom-1',
      undefined,
      2026,
      7,
      globalAdmin
    )
    expect(result).toEqual({ _id: 'svc-1' })
    expect(mockService.create).not.toHaveBeenCalled()
  })

  it('creates an empty (zeroed) Service when none exists', async () => {
    mockService.findOne.mockResolvedValue(null)
    mockService.create.mockResolvedValue({ _id: 'svc-new' })

    await resolveMonthService('dom-1', undefined, 2026, 7, globalAdmin)

    const created = mockService.create.mock.calls[0][0]
    expect(created).toMatchObject({
      domain: 'dom-1',
      rentPrice: 0,
      electricityPrice: 0,
      waterPrice: 0,
    })
    // street must be omitted (empty string fails ObjectId cast on the backend)
    expect(created.street).toBeUndefined()
  })

  it('blocks a domain admin from a domain they do not administer', async () => {
    mockDomain.exists.mockResolvedValue(null)
    await expect(
      resolveMonthService('other-dom', undefined, 2026, 7, domainAdmin)
    ).rejects.toThrow('domain not accessible')
  })
})

describe('buildInvoiceDraft', () => {
  function stubCompany() {
    mockRealEstate.findById.mockReturnValue({
      populate: () => ({
        _id: 'co-1',
        companyName: 'Acme',
        street: null,
        currency: 'UAH',
        domain: { _id: 'dom-1', description: 'domain desc' },
      }),
    })
    mockDomain.exists.mockResolvedValue(true)
    mockService.findOne.mockResolvedValue({ _id: 'svc-1' })
  }

  it('sums invoice lines + extra lines into generalSum', async () => {
    stubCompany()
    mockGetInvoices.mockReturnValue([
      { type: 'maintenancePrice', name: 'Утримання', price: 100, sum: 300 },
      { type: 'electricityPrice', name: 'Електрика', price: 5, sum: 0 },
    ])

    const draft = await buildInvoiceDraft({
      companyId: 'co-1',
      month: 7,
      year: 2026,
      extraLines: [{ name: 'Оренда', sum: 5000 }],
      ctx: globalAdmin,
    })

    // 300 (kept) + 0 (dropped) + 5000 extra = 5300
    expect(draft.generalSum).toBe(5300)
    expect(draft.invoice).toHaveLength(2) // zero-sum line filtered out
    expect(draft.invoiceNumber).toBe(101)
    expect(draft.type).toBe('debit')
    expect(draft.company).toBe('co-1')
  })

  it('yields zero-value draft when the Service is empty (no lines)', async () => {
    stubCompany()
    mockGetInvoices.mockReturnValue([])

    const draft = await buildInvoiceDraft({
      companyId: 'co-1',
      month: 7,
      year: 2026,
      ctx: globalAdmin,
    })

    expect(draft.generalSum).toBe(0)
    expect(draft.invoice).toEqual([])
  })
})
