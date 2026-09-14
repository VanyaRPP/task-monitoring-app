import { expect } from '@jest/globals'
import handler from '../[id]/archive'
import companyArchiveHandler from '@pages/api/archived/[id]'

import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, users } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

const createMockResponse = () => {
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(),
  } as any

  return res
}

const archiveDomain = async (domainId: string, archived = true) => {
  await mockLoginAs(users.globalAdmin)

  const req = {
    method: 'PATCH',
    query: { id: domainId },
    body: { archived },
  } as any

  const res = createMockResponse()
  await handler(req, res)
  return res
}

const archiveCompany = async (companyId: string, archived = true) => {
  await mockLoginAs(users.globalAdmin)

  const req = {
    method: 'PATCH',
    query: { id: companyId },
    body: { archived },
  } as any

  const res = createMockResponse()
  await companyArchiveHandler(req, res)
  return res
}

describe('Domain API - ARCHIVE', () => {
  it('archives domain without companies', async () => {
    const companyDomainIds = await RealEstate.distinct('domain')
    const domainWithoutCompanies = await Domain.findOne({
      _id: {
        $nin: companyDomainIds,
      },
    })
    expect(domainWithoutCompanies).toBeTruthy()

    if (!domainWithoutCompanies) {
      throw new Error('Domain without companies was not found')
    }

    const res = await archiveDomain(domainWithoutCompanies._id.toString())
    expect(res.status).toHaveBeenCalledWith(200)

    const archivedDomain = await Domain.findById(domainWithoutCompanies._id)
    expect(archivedDomain?.archived).toBe(true)
  })

  it('archives domain and its single company', async () => {
    const domainWithOneCompany = await RealEstate.aggregate([
      {
        $group: {
          _id: '$domain',
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: 1,
        },
      },
      {
        $limit: 1,
      },
    ])
    expect(domainWithOneCompany.length).toBe(1)

    const domainId = domainWithOneCompany[0]._id
    const company = await RealEstate.findOne({
      domain: domainId,
    })
    expect(company).toBeTruthy()

    if (!company) {
      throw new Error('Company was not found')
    }

    const res = await archiveDomain(domainId.toString())
    expect(res.status).toHaveBeenCalledWith(200)

    const archivedDomain = await Domain.findById(domainId)
    const archivedCompany = await RealEstate.findById(company._id)
    expect(archivedDomain?.archived).toBe(true)
    expect(archivedCompany?.archived).toBe(true)
  })

  it('archives all companies of the domain', async () => {
    const domainWithCompanies = await RealEstate.aggregate([
      {
        $group: {
          _id: '$domain',
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gte: 2 },
        },
      },
      {
        $limit: 1,
      },
    ])
    expect(domainWithCompanies.length).toBe(1)

    const domainId = domainWithCompanies[0]._id
    const companiesBefore = await RealEstate.find({
      domain: domainId,
    })
    expect(companiesBefore.length).toBeGreaterThanOrEqual(2)

    const res = await archiveDomain(domainId.toString())
    expect(res.status).toHaveBeenCalledWith(200)

    const companiesAfter = await RealEstate.find({
      domain: domainId,
    })
    expect(companiesAfter.every((company) => company.archived === true)).toBe(
      true
    )
  })

  it('does not change companies of other domains', async () => {
    const domainsWithCompanies = await RealEstate.aggregate([
      {
        $group: {
          _id: '$domain',
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gte: 1 },
        },
      },
      {
        $limit: 2,
      },
    ])
    expect(domainsWithCompanies.length).toBe(2)

    const domainA = domainsWithCompanies[0]._id
    const domainB = domainsWithCompanies[1]._id
    const companiesOfDomainB = await RealEstate.find({ domain: domainB })
    const statusesBefore = companiesOfDomainB.map((company) => ({
      id: company._id.toString(),
      archived: company.archived,
    }))
    const res = await archiveDomain(domainA.toString())
    expect(res.status).toHaveBeenCalledWith(200)

    const companiesOfDomainBAfter = await RealEstate.find({ domain: domainB })
    expect(
      companiesOfDomainBAfter.map((company) => ({
        id: company._id.toString(),
        archived: company.archived,
      }))
    ).toEqual(statusesBefore)
  })

  it('archiving a single company does not archive its domain', async () => {
    const company = await RealEstate.findOne({ archived: false })
    expect(company).toBeTruthy()

    const domainBefore = await Domain.findById(company.domain)
    expect(domainBefore?.archived).toBe(false)

    const res = await archiveCompany(company._id.toString())
    expect(res.status).toHaveBeenCalledWith(200)

    const archivedCompany = await RealEstate.findById(company._id)
    expect(archivedCompany?.archived).toBe(true)

    const domainAfter = await Domain.findById(company.domain)
    expect(domainAfter?.archived).toBe(false)
  })

  it('does not fail when archiving an already archived domain', async () => {
    const domain = await Domain.findOneAndUpdate(
      {},
      { archived: true },
      { new: true }
    )
    expect(domain).toBeTruthy()

    const res = await archiveDomain(domain._id.toString())
    expect(res.status).toHaveBeenCalledWith(200)

    const archivedDomain = await Domain.findById(domain._id)
    expect(archivedDomain?.archived).toBe(true)

    const companies = await RealEstate.find({
      domain: domain._id,
    })
    expect(companies.every((company) => company.archived === true)).toBe(true)
  })

  it('persists archived status of all related companies in DB', async () => {
    const domainWithCompanies = await RealEstate.aggregate([
      {
        $group: {
          _id: '$domain',
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gte: 1 },
        },
      },
      {
        $limit: 1,
      },
    ])
    expect(domainWithCompanies.length).toBe(1)

    const domainId = domainWithCompanies[0]._id
    const res = await archiveDomain(domainId.toString())
    expect(res.status).toHaveBeenCalledWith(200)

    const domainFromDb = await Domain.findById(domainId)
    const companiesFromDb = await RealEstate.find({
      domain: domainId,
    })
    expect(domainFromDb?.archived).toBe(true)
    expect(companiesFromDb.length).toBeGreaterThan(0)
    for (const company of companiesFromDb) {
      expect(company.archived).toBe(true)
    }
  })
})
