import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import handler from '@pages/api/custom-services'
import { getCurrentUser } from '@utils/getCurrentUser'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, users } from '@utils/testData'

jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    isGlobalAdmin: false,
    isDomainAdmin: false,
    isUser: false,
    user: { email: '' },
  }),
}))

setupTestEnvironment()

const ownDomainId = domains[0]._id
const otherDomainId = domains[6]._id

const mockUser = (
  overrides: Partial<{
    isGlobalAdmin: boolean
    isDomainAdmin: boolean
    isUser: boolean
    email: string
  }> = {}
) =>
  (getCurrentUser as jest.Mock).mockResolvedValueOnce({
    isGlobalAdmin: false,
    isDomainAdmin: false,
    isUser: false,
    user: { email: overrides.email ?? '' },
    ...overrides,
  })

const mockRes = () =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }) as any

const createService = (overrides: Record<string, unknown> = {}) =>
  CustomService.create({
    name: 'Old Service Name',
    fieldName: 'oldServiceName',
    ...overrides,
  })

describe('API Route - PATCH Method', () => {
  beforeEach(async () => {
    await CustomService.deleteMany({})
  })

  it('should block regular users', async () => {
    mockUser({ isUser: true, email: users.user.email })
    const service = await createService({ domain: ownDomainId })

    const req = {
      method: 'PATCH',
      query: { id: service._id, domainId: ownDomainId },
      body: { name: 'New Name' },
    } as any
    const res = mockRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 400 if DomainAdmin omits domainId', async () => {
    mockUser({ isDomainAdmin: true, email: users.domainAdmin.email })
    const service = await createService({ domain: ownDomainId })

    const req = {
      method: 'PATCH',
      query: { id: service._id },
      body: { name: 'X' },
    } as any
    const res = mockRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('should allow GlobalAdmin to edit service without domainId', async () => {
    mockUser({ isGlobalAdmin: true, email: users.globalAdmin.email })
    const service = await createService({ domain: ownDomainId })

    const req = {
      method: 'PATCH',
      query: { id: service._id },
      body: { name: 'New Service Name' },
    } as any
    const res = mockRes()

    await handler(req, res)

    const updated = await CustomService.findById(service._id)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(updated?.name).toBe('New Service Name')
  })

  it('should let GlobalAdmin rename a per-domain service from any domain', async () => {
    mockUser({ isGlobalAdmin: true, email: users.globalAdmin.email })
    const foreign = await createService({ domain: otherDomainId })

    const req = {
      method: 'PATCH',
      query: { id: foreign._id, domainId: ownDomainId },
      body: { name: 'Renamed' },
    } as any
    const res = mockRes()

    await handler(req, res)

    const updated = await CustomService.findById(foreign._id)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(updated?.name).toBe('Renamed')
  })

  it('should let GlobalAdmin rename a legacy service in place without cloning', async () => {
    mockUser({ isGlobalAdmin: true, email: users.globalAdmin.email })
    const legacy = await createService({ name: 'Legacy', fieldName: 'legacy' })

    const req = {
      method: 'PATCH',
      query: { id: legacy._id },
      body: { name: 'Legacy Renamed' },
    } as any
    const res = mockRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const original = await CustomService.findById(legacy._id)
    expect(original?.name).toBe('Legacy Renamed')
    const renamed = await CustomService.find({ name: 'Legacy Renamed' }).lean()
    expect(renamed).toHaveLength(1)
  })

  it('should allow DomainAdmin to edit service of own domain', async () => {
    mockUser({ isDomainAdmin: true, email: users.domainAdmin.email })
    const service = await createService({ domain: ownDomainId })

    const req = {
      method: 'PATCH',
      query: { id: service._id, domainId: ownDomainId },
      body: { name: 'Renamed By DomainAdmin' },
    } as any
    const res = mockRes()

    await handler(req, res)

    const updated = await CustomService.findById(service._id)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(updated?.name).toBe('Renamed By DomainAdmin')
  })

  it('should return 403 when DomainAdmin acts in a domain they do not own', async () => {
    mockUser({ isDomainAdmin: true, email: users.domainAdmin.email })
    const service = await createService({ domain: otherDomainId })

    const req = {
      method: 'PATCH',
      query: { id: service._id, domainId: otherDomainId },
      body: { name: 'Hacked' },
    } as any
    const res = mockRes()

    await handler(req, res)

    const unchanged = await CustomService.findById(service._id)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(unchanged?.name).toBe('Old Service Name')
  })

  it('should let DomainAdmin rename a legacy service in place without cloning', async () => {
    mockUser({ isDomainAdmin: true, email: users.domainAdmin.email })
    const legacy = await createService({
      name: 'Legacy',
      fieldName: 'legacy',
    })

    const req = {
      method: 'PATCH',
      query: { id: legacy._id, domainId: ownDomainId },
      body: { name: 'Legacy Renamed' },
    } as any
    const res = mockRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const original = await CustomService.findById(legacy._id)
    expect(original?.name).toBe('Legacy Renamed')

    const all = await CustomService.find({ name: 'Legacy Renamed' }).lean()
    expect(all).toHaveLength(1)
  })

  it('should enforce per-domain uniqueness, not global', async () => {
    mockUser({ isDomainAdmin: true, email: users.domainAdmin.email })
    await CustomService.create({
      name: 'Foo',
      fieldName: 'foo',
      domain: ownDomainId,
    })
    await CustomService.create({
      name: 'Foo',
      fieldName: 'foo',
      domain: otherDomainId,
    })
    const ownTarget = await createService({ domain: ownDomainId })

    const req = {
      method: 'PATCH',
      query: { id: ownTarget._id, domainId: ownDomainId },
      body: { name: 'Foo' },
    } as any
    const res = mockRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(409)
  })

  it('should allow same name in another domain', async () => {
    mockUser({ isGlobalAdmin: true, email: users.globalAdmin.email })
    await CustomService.create({
      name: 'Foo',
      fieldName: 'foo',
      domain: ownDomainId,
    })
    const otherTarget = await createService({ domain: otherDomainId })

    const req = {
      method: 'PATCH',
      query: { id: otherTarget._id, domainId: otherDomainId },
      body: { name: 'Foo' },
    } as any
    const res = mockRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const updated = await CustomService.findById(otherTarget._id)
    expect(updated?.name).toBe('Foo')
  })

  it('should return 400 when name is empty', async () => {
    mockUser({ isDomainAdmin: true, email: users.domainAdmin.email })
    const service = await createService({ domain: ownDomainId })

    const req = {
      method: 'PATCH',
      query: { id: service._id, domainId: ownDomainId },
      body: { name: '   ' },
    } as any
    const res = mockRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('should return 404 if service not found', async () => {
    mockUser({ isDomainAdmin: true, email: users.domainAdmin.email })

    const req = {
      method: 'PATCH',
      query: {
        id: '507f191e810c19729de860ea',
        domainId: ownDomainId,
      },
      body: { name: 'Any Name' },
    } as any
    const res = mockRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})
