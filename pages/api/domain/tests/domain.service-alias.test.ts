import { expect } from '@jest/globals'
import aliasHandler from '../[id]/service-alias'
import domainHandler from '../[id]'
import Domain from '@modules/models/Domain'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, users } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

const domainA = domains[0]._id // administered by users.domainAdmin
const domainB = domains[1]._id // administered by nobody
const serviceId = '682dd48d9665126611c81950'

const mockRes = () => {
  const res = { status: jest.fn(() => res), json: jest.fn(), end: jest.fn() }
  return res as any
}

const putAlias = async (
  id: string,
  body: Record<string, unknown>,
  as = users.globalAdmin
) => {
  await mockLoginAs(as)
  const res = mockRes()
  await aliasHandler({ method: 'PUT', query: { id }, body } as any, res)
  return res
}

describe('PUT /api/domain/[id]/service-alias', () => {
  it('lets a domain admin set an alias on their own domain', async () => {
    const res = await putAlias(
      domainA,
      { serviceId, serviceType: 'placingPrice', alias: 'Освітня послуга' },
      users.domainAdmin
    )
    expect(res.status).toHaveBeenCalledWith(200)
    const saved = await Domain.findById(domainA).lean()
    expect(saved?.serviceAliases).toEqual([
      { serviceId, serviceType: 'placingPrice', alias: 'Освітня послуга' },
    ])
  })

  it("refuses a domain admin on someone else's domain", async () => {
    const res = await putAlias(
      domainB,
      { serviceId, alias: 'X' },
      users.domainAdmin
    )
    expect(res.status).toHaveBeenCalledWith(403)
    const saved = await Domain.findById(domainB).lean()
    expect(saved?.serviceAliases ?? []).toEqual([])
  })

  it('clears the alias when sent empty', async () => {
    await putAlias(domainA, { serviceId, alias: 'A' })
    await putAlias(domainA, { serviceId, alias: '  ' })
    const saved = await Domain.findById(domainA).lean()
    expect(saved?.serviceAliases).toEqual([])
  })

  it('rejects an invalid service id', async () => {
    const res = await putAlias(domainA, { serviceId: 'nope', alias: 'A' })
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('domain PATCH cannot overwrite aliases but can set the hide flag', async () => {
    await putAlias(domainA, { serviceId, alias: 'Keep' })
    await mockLoginAs(users.globalAdmin)
    const res = mockRes()
    await domainHandler(
      {
        method: 'PATCH',
        query: { id: domainA },
        body: { serviceAliases: [], hideQuantityAndPrice: true },
      } as any,
      res
    )
    const saved = await Domain.findById(domainA).lean()
    expect(saved?.serviceAliases?.[0]?.alias).toBe('Keep')
    expect(saved?.hideQuantityAndPrice).toBe(true)
  })
})
