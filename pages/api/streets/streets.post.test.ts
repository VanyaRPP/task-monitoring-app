import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, users } from '@utils/testData'
import Domain from '@modules/models/Domain'
import Street from '@modules/models/Street'
import handler from './index'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

function createMockRes() {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn()
  return res
}

const post = async (body: Record<string, unknown>) => {
  const res = createMockRes()
  await handler({ method: 'POST', query: {}, body } as any, res)
  return res
}

const streetsOf = async (domainId: string) =>
  ((await Domain.findById(domainId).lean()).streets ?? []).map(String)

// domainAdmin runs domains[0]; domains[1] belongs to nobody they know.
describe('Streets API - POST /api/streets', () => {
  it('refuses a user who is not an admin', async () => {
    await mockLoginAs(users.user)
    const res = await post({ address: 'вул. Шевченка, 5', city: 'Львів' })

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it("adds the street to the admin's own domain", async () => {
    await mockLoginAs(users.domainAdmin)
    const res = await post({
      address: 'вул. Шевченка, 5',
      city: 'Львів',
      domain: domains[0]._id,
    })

    expect(res.status).toHaveBeenCalledWith(200)
    const created = res.json.mock.calls[0][0].data
    expect(created).toMatchObject({
      address: 'вул. Шевченка, 5',
      city: 'Львів',
    })
    expect(await streetsOf(domains[0]._id)).toContain(String(created._id))
  })

  it("refuses another admin's domain and creates nothing", async () => {
    await mockLoginAs(users.domainAdmin)
    const before = await Street.countDocuments()
    const res = await post({
      address: 'вул. Шевченка, 5',
      city: 'Львів',
      domain: domains[1]._id,
    })

    expect(res.status).toHaveBeenCalledWith(403)
    expect(await Street.countDocuments()).toBe(before)
    expect(await streetsOf(domains[1]._id)).toHaveLength(1)
  })

  it('lets a global admin add to any domain', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await post({
      address: 'вул. Шевченка, 5',
      city: 'Львів',
      domain: domains[1]._id,
    })

    expect(res.status).toHaveBeenCalledWith(200)
    expect(await streetsOf(domains[1]._id)).toHaveLength(2)
  })

  it('creates a free street when no domain is given', async () => {
    await mockLoginAs(users.domainAdmin)
    const res = await post({
      address: 'вул. Шевченка, 5',
      city: 'Львів',
      _id: '64d68421d9ba2fc8fea79d31',
    })

    expect(res.status).toHaveBeenCalledWith(200)
    // Only address and city are taken from the body.
    const created = res.json.mock.calls[0][0].data
    expect(String(created._id)).not.toBe('64d68421d9ba2fc8fea79d31')
  })
})
