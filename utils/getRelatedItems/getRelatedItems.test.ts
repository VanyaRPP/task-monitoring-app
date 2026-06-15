jest.mock('@modules/models/User', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}))
jest.mock('@modules/models/Domain', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}))
jest.mock('@modules/models/RealEstate', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}))
jest.mock('@modules/models/Service', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}))
jest.mock('@modules/models/Payment', () => ({
  __esModule: true,
  default: { distinct: jest.fn() },
}))
jest.mock('@modules/models/Street', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}))

import User from '@modules/models/User'
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import Service from '@modules/models/Service'
import Payment from '@modules/models/Payment'
import Street from '@modules/models/Street'

import { getRelatedDomains } from './getRelatedDomains'
import { getRelatedCompanies } from './getRelatedCompanies'
import { getRelatedServices } from './getRelatedServices'
import { getRelatedPayments } from './getRelatedPayments'
import { getRelatedStreets } from './getRelatedStreets'

const userFindById = User.findById as jest.Mock
const domainFind = Domain.find as jest.Mock
const realEstateFind = RealEstate.find as jest.Mock
const serviceFind = Service.find as jest.Mock
const paymentDistinct = Payment.distinct as jest.Mock
const streetFind = Street.find as jest.Mock

// User.findById(id).select('email') -> resolves the user (or null)
const mockUser = (email: string | null) => {
  userFindById.mockReturnValue({
    select: jest.fn().mockResolvedValue(email ? { email } : null),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getRelatedDomains', () => {
  it('looks up the admin email and returns ids of domains they administer', async () => {
    mockUser('admin@x')
    domainFind.mockResolvedValue([{ _id: 'd1' }, { _id: 'd2' }])

    const { domainIds } = await getRelatedDomains('u1')

    expect(userFindById).toHaveBeenCalledWith('u1')
    expect(domainFind).toHaveBeenCalledWith({ adminEmails: 'admin@x' })
    expect(domainIds).toEqual(['d1', 'd2'])
  })

  it('throws if the user no longer exists', async () => {
    mockUser(null)
    await expect(getRelatedDomains('u1')).rejects.toThrow()
  })
})

describe('getRelatedCompanies', () => {
  it('returns ids of real estate within the user domains', async () => {
    mockUser('admin@x')
    domainFind.mockResolvedValue([{ _id: 'd1' }])
    realEstateFind.mockResolvedValue([{ _id: 'c1' }, { _id: 'c2' }])

    const { companyIds } = await getRelatedCompanies('u1')

    expect(realEstateFind).toHaveBeenCalledWith({ domain: { $in: ['d1'] } })
    expect(companyIds).toEqual(['c1', 'c2'])
  })
})

describe('getRelatedServices', () => {
  it('returns ids of services within the user domains', async () => {
    mockUser('admin@x')
    domainFind.mockResolvedValue([{ _id: 'd1' }])
    serviceFind.mockResolvedValue([{ _id: 's1' }])

    const { serviceIds } = await getRelatedServices('u1')

    expect(serviceFind).toHaveBeenCalledWith({ domain: { $in: ['d1'] } })
    expect(serviceIds).toEqual(['s1'])
  })
})

describe('getRelatedPayments', () => {
  it('intersects domains, services and companies via distinct', async () => {
    mockUser('admin@x')
    domainFind.mockResolvedValue([{ _id: 'd1' }])
    serviceFind.mockResolvedValue([{ _id: 's1' }])
    realEstateFind.mockResolvedValue([{ _id: 'c1' }])
    paymentDistinct.mockResolvedValue(['p1', 'p2'])

    const { paymentsIds } = await getRelatedPayments('u1')

    expect(paymentDistinct).toHaveBeenCalledWith('_id', {
      domain: { $in: ['d1'] },
      service: { $in: ['s1'] },
      company: { $in: ['c1'] },
    })
    expect(paymentsIds).toEqual(['p1', 'p2'])
  })
})

describe('getRelatedStreets', () => {
  it('returns all streets regardless of the user', async () => {
    mockUser('admin@x')
    const streets = [{ _id: 'st1' }]
    streetFind.mockResolvedValue(streets)

    const { solo } = await getRelatedStreets('u1')

    expect(streetFind).toHaveBeenCalledWith({})
    expect(solo).toBe(streets)
  })
})
