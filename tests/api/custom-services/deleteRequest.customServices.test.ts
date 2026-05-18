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
const otherAdminDomainId = domains[6]._id

const mockUser = (overrides: Partial<{
  isGlobalAdmin: boolean
  isDomainAdmin: boolean
  isUser: boolean
  email: string
}> = {}) =>
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
  } as any)

const createService = (overrides: Record<string, unknown> = {}) =>
  CustomService.create({
    name: 'Test Service',
    fieldName: 'testService',
    ...overrides,
  })

describe('API Route - DELETE Method', () => {
  beforeEach(async () => {
    await CustomService.deleteMany({})
  })

  it('should return 403 when caller has no admin role', async () => {
    const req = { method: 'DELETE', query: { id: 'some-id' } } as any
    const res = mockRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should block regular users', async () => {
    mockUser({ isUser: true, email: users.user.email })
    const service = await createService({ domain: ownDomainId })

    const req = {
      method: 'DELETE',
      query: { id: service._id, domainId: ownDomainId },
    } as any
    const res = mockRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 400 if domainId missing for DomainAdmin', async () => {
    mockUser({ isDomainAdmin: true, email: users.domainAdmin.email })
    const service = await createService({ domain: ownDomainId })

    const req = {
      method: 'DELETE',
      query: { id: service._id },
    } as any
    const res = mockRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('should allow GlobalAdmin to delete service without domainId', async () => {
    mockUser({ isGlobalAdmin: true, email: users.globalAdmin.email })
    const service = await createService({ domain: ownDomainId })

    const req = {
      method: 'DELETE',
      query: { id: service._id },
    } as any
    const res = mockRes()

    await handler(req, res)

    const deleted = await CustomService.findById(service._id)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(deleted).toBeNull()
  })

  it('should allow GlobalAdmin to delete a per-domain service from any domain', async () => {
    mockUser({ isGlobalAdmin: true, email: users.globalAdmin.email })
    const foreign = await createService({ domain: otherDomainId })

    const req = {
      method: 'DELETE',
      query: { id: foreign._id, domainId: ownDomainId },
    } as any
    const res = mockRes()

    await handler(req, res)

    const deleted = await CustomService.findById(foreign._id)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(deleted).toBeNull()
  })

  it('should allow GlobalAdmin to delete a legacy (no-domain) service outright', async () => {
    mockUser({ isGlobalAdmin: true, email: users.globalAdmin.email })
    const legacy = await createService({ name: 'Legacy', fieldName: 'legacy' })

    const req = {
      method: 'DELETE',
      query: { id: legacy._id },
    } as any
    const res = mockRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: 'Сервіс успішно видалено',
    })
    expect(await CustomService.findById(legacy._id)).toBeNull()
  })

  it('should allow DomainAdmin to delete service of own domain', async () => {
    mockUser({ isDomainAdmin: true, email: users.domainAdmin.email })
    const service = await createService({ domain: ownDomainId })

    const req = {
      method: 'DELETE',
      query: { id: service._id, domainId: ownDomainId },
    } as any
    const res = mockRes()

    await handler(req, res)

    const deleted = await CustomService.findById(service._id)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: 'Сервіс успішно видалено',
    })
    expect(deleted).toBeNull()
  })

  it('should return 403 when DomainAdmin tries to delete in a domain they do not own', async () => {
    mockUser({ isDomainAdmin: true, email: users.domainAdmin.email })
    const service = await createService({ domain: otherAdminDomainId })

    const req = {
      method: 'DELETE',
      query: { id: service._id, domainId: otherAdminDomainId },
    } as any
    const res = mockRes()

    await handler(req, res)

    const stillThere = await CustomService.findById(service._id)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(stillThere).not.toBeNull()
  })

  it('should keep other domain copies intact when same-named service is deleted', async () => {
    mockUser({ isDomainAdmin: true, email: users.domainAdmin.email })
    const own = await createService({
      name: 'Shared',
      fieldName: 'shared',
      domain: ownDomainId,
    })
    const otherDomainCopy = await createService({
      name: 'Shared',
      fieldName: 'shared',
      domain: otherDomainId,
    })

    const req = {
      method: 'DELETE',
      query: { id: own._id, domainId: ownDomainId },
    } as any
    const res = mockRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(await CustomService.findById(own._id)).toBeNull()
    expect(await CustomService.findById(otherDomainCopy._id)).not.toBeNull()
  })

  it('should unlink a legacy (no-domain) service from caller domain only, leaving the document intact', async () => {
    mockUser({ isDomainAdmin: true, email: users.domainAdmin.email })
    const legacy = await createService({
      name: 'Legacy',
      fieldName: 'legacy',
    })

    await Domain.updateOne(
      { _id: ownDomainId },
      {
        $set: {
          customServices: [
            { groupName: 'Default', services: [String(legacy._id)] },
          ],
        },
      }
    )
    await Domain.updateOne(
      { _id: otherDomainId },
      {
        $set: {
          customServices: [
            { groupName: 'Default', services: [String(legacy._id)] },
          ],
        },
      }
    )

    const req = {
      method: 'DELETE',
      query: { id: legacy._id, domainId: ownDomainId },
    } as any
    const res = mockRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: 'Послуга прибрана з цього домену',
    })
    expect(await CustomService.findById(legacy._id)).not.toBeNull()

    const ownDomain = await Domain.findById(ownDomainId).lean()
    const otherDomain = await Domain.findById(otherDomainId).lean()
    expect(ownDomain.customServices[0].services).not.toContain(String(legacy._id))
    expect(otherDomain.customServices[0].services).toContain(String(legacy._id))
  })

  it('should return 404 if service not found', async () => {
    mockUser({ isGlobalAdmin: true, email: users.globalAdmin.email })

    const req = {
      method: 'DELETE',
      query: { id: '507f191e810c19729de860ea', domainId: ownDomainId },
    } as any
    const res = mockRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})
