import {
  buildInvoiceDraft,
  findDomainsByName,
  findMonthService,
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

describe('findMonthService', () => {
  it('returns the existing Service when one is found', async () => {
    mockService.findOne.mockResolvedValue({ _id: 'svc-1' })
    const result = await findMonthService(
      'dom-1',
      undefined,
      2026,
      7,
      globalAdmin
    )
    expect(result).toEqual({ _id: 'svc-1' })
  })

  it('returns null and creates nothing when the month has no Service', async () => {
    mockService.findOne.mockResolvedValue(null)

    const result = await findMonthService(
      'dom-1',
      undefined,
      2026,
      7,
      globalAdmin
    )

    expect(result).toBeNull()
    expect(mockService.create).not.toHaveBeenCalled()
  })

  it('blocks a domain admin from a domain they do not administer', async () => {
    mockDomain.exists.mockResolvedValue(null)
    await expect(
      findMonthService('other-dom', undefined, 2026, 7, domainAdmin)
    ).rejects.toThrow('domain not accessible')
  })
})
