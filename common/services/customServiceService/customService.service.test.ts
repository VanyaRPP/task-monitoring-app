import mongoose from 'mongoose'
import {
  createCustomService,
  deleteCustomService,
  isServiceErr,
  listCustomServicesForDomain,
  updateCustomService,
  UserContext,
} from './customService.service'

jest.mock('@modules/models/CustomService', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
  },
}))

jest.mock('@modules/models/Domain', () => ({
  __esModule: true,
  default: {
    exists: jest.fn(),
    updateOne: jest.fn(),
  },
}))

jest.mock('@modules/models/RealEstate', () => ({
  __esModule: true,
  default: {
    updateMany: jest.fn(),
  },
}))

jest.mock(
  '@common/services/domainTypeTemplateService/domainTypeTemplate.service',
  () => ({
    getDefaultServiceIdsForCategory: jest.fn().mockResolvedValue([]),
  })
)

import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import { getDefaultServiceIdsForCategory } from '@common/services/domainTypeTemplateService/domainTypeTemplate.service'

const ownDomainId = new mongoose.Types.ObjectId()
const otherDomainId = new mongoose.Types.ObjectId()
const serviceId = new mongoose.Types.ObjectId()

const ctxGlobal: UserContext = {
  isGlobalAdmin: true,
  isDomainAdmin: false,
  isUser: false,
  user: { email: 'global@x' },
}

const ctxDomain: UserContext = {
  isGlobalAdmin: false,
  isDomainAdmin: true,
  isUser: false,
  user: { email: 'domain@x' },
}

const ctxUser: UserContext = {
  isGlobalAdmin: false,
  isDomainAdmin: false,
  isUser: true,
  user: { email: 'user@x' },
}

const asMock = <T>(fn: T) => fn as unknown as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  asMock(Domain.exists).mockResolvedValue({ _id: ownDomainId })
  asMock(Domain.updateOne).mockResolvedValue({
    acknowledged: true,
    matchedCount: 1,
  })
  asMock(RealEstate.updateMany).mockResolvedValue({ acknowledged: true })
})

describe('access gating', () => {
  it('rejects non-admin callers', async () => {
    const result = await deleteCustomService(
      String(serviceId),
      { domainId: String(ownDomainId) },
      ctxUser
    )
    expect(result).toEqual({
      ok: false,
      code: 'forbidden',
      message: expect.any(String),
    })
  })

  it('rejects DomainAdmin without domainId', async () => {
    asMock(CustomService.findById).mockResolvedValueOnce({
      _id: serviceId,
      domain: ownDomainId,
    })
    const result = await deleteCustomService(
      String(serviceId),
      { domainId: undefined },
      ctxDomain
    )
    expect(result.ok).toBe(false)
    if (isServiceErr(result)) expect(result.code).toBe('invalid')
  })

  it('rejects DomainAdmin not listed on the target domain', async () => {
    asMock(CustomService.findById).mockResolvedValueOnce({
      _id: serviceId,
      domain: ownDomainId,
    })
    asMock(Domain.exists).mockResolvedValueOnce(null)
    const result = await deleteCustomService(
      String(serviceId),
      { domainId: String(ownDomainId) },
      ctxDomain
    )
    expect(result.ok).toBe(false)
    if (isServiceErr(result)) expect(result.code).toBe('forbidden')
  })
})

describe('createCustomService', () => {
  it('rejects empty name', async () => {
    const result = await createCustomService(
      { name: '   ', domainId: String(ownDomainId) },
      ctxGlobal
    )
    expect(result.ok).toBe(false)
    if (isServiceErr(result)) expect(result.code).toBe('invalid')
  })

  it('rejects when duplicate exists in same domain', async () => {
    asMock(CustomService.findOne).mockResolvedValueOnce({ _id: 'dup' })
    const result = await createCustomService(
      { name: 'Foo', domainId: String(ownDomainId) },
      ctxGlobal
    )
    expect(result.ok).toBe(false)
    if (isServiceErr(result)) expect(result.code).toBe('conflict')
  })

  it('creates a per-domain service when no duplicate', async () => {
    asMock(CustomService.findOne).mockResolvedValueOnce(null)
    asMock(CustomService.create).mockResolvedValueOnce({
      _id: serviceId,
      name: 'Foo',
      fieldName: 'foo',
      domain: ownDomainId,
      toObject: () => ({
        _id: serviceId,
        name: 'Foo',
        fieldName: 'foo',
        domain: ownDomainId,
      }),
    })

    const result = await createCustomService(
      { name: 'Foo', domainId: String(ownDomainId) },
      ctxGlobal
    )

    expect(result.ok).toBe(true)
    expect(asMock(CustomService.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Foo',
        domain: expect.anything(),
      })
    )
  })

  it('auto-attaches new service to default domain group when creating', async () => {
    asMock(CustomService.findOne).mockResolvedValueOnce(null)
    asMock(CustomService.create).mockResolvedValueOnce({
      _id: serviceId,
      name: 'Foo',
      fieldName: 'foo',
      domain: ownDomainId,
      toObject: () => ({
        _id: serviceId,
        name: 'Foo',
        fieldName: 'foo',
      }),
    })
    // First call attempts to add to existing default group — pretend it exists.
    asMock(Domain.updateOne).mockResolvedValueOnce({
      acknowledged: true,
      matchedCount: 1,
    })

    await createCustomService(
      { name: 'Foo', domainId: String(ownDomainId) },
      ctxGlobal
    )

    expect(asMock(Domain.updateOne)).toHaveBeenCalledWith(
      { _id: expect.anything(), 'customServices.groupName': 'Загальні' },
      expect.objectContaining({
        $addToSet: { 'customServices.$[group].services': serviceId },
      }),
      expect.objectContaining({
        arrayFilters: [{ 'group.groupName': 'Загальні' }],
      })
    )
  })

  it('creates default group when missing during auto-attach', async () => {
    asMock(CustomService.findOne).mockResolvedValueOnce(null)
    asMock(CustomService.create).mockResolvedValueOnce({
      _id: serviceId,
      name: 'Foo',
      fieldName: 'foo',
      domain: ownDomainId,
      toObject: () => ({
        _id: serviceId,
        name: 'Foo',
        fieldName: 'foo',
      }),
    })
    // First call: no matching group (matchedCount: 0).
    asMock(Domain.updateOne)
      .mockResolvedValueOnce({ acknowledged: true, matchedCount: 0 })
      .mockResolvedValueOnce({ acknowledged: true })

    await createCustomService(
      { name: 'Foo', domainId: String(ownDomainId) },
      ctxGlobal
    )

    // Second call appends a new group entry.
    expect(asMock(Domain.updateOne)).toHaveBeenNthCalledWith(
      2,
      { _id: expect.anything() },
      {
        $push: {
          customServices: {
            groupName: 'Загальні',
            services: [serviceId],
          },
        },
      }
    )
  })

  it('cascades the new service to every active company of the domain', async () => {
    asMock(CustomService.findOne).mockResolvedValueOnce(null)
    asMock(CustomService.create).mockResolvedValueOnce({
      _id: serviceId,
      name: 'Foo',
      fieldName: 'foo',
      domain: ownDomainId,
      toObject: () => ({
        _id: serviceId,
        name: 'Foo',
        fieldName: 'foo',
      }),
    })

    await createCustomService(
      { name: 'Foo', domainId: String(ownDomainId) },
      ctxGlobal
    )

    expect(asMock(RealEstate.updateMany)).toHaveBeenCalledWith(
      { domain: expect.anything(), archived: { $ne: true } },
      {
        $push: {
          customServices: {
            _id: serviceId,
            label: 'Foo',
            fieldName: 'foo',
            price: 0,
          },
        },
      }
    )
  })
})

describe('updateCustomService', () => {
  it('returns not_found when service missing', async () => {
    asMock(CustomService.findById).mockResolvedValueOnce(null)
    const result = await updateCustomService(
      String(serviceId),
      { name: 'X', domainId: String(ownDomainId) },
      ctxGlobal
    )
    expect(result.ok).toBe(false)
    if (isServiceErr(result)) expect(result.code).toBe('not_found')
  })

  it('refuses DomainAdmin update of service from another domain', async () => {
    asMock(CustomService.findById).mockResolvedValueOnce({
      _id: serviceId,
      domain: otherDomainId,
    })
    const result = await updateCustomService(
      String(serviceId),
      { name: 'X', domainId: String(ownDomainId) },
      ctxDomain
    )
    expect(result.ok).toBe(false)
    if (isServiceErr(result)) expect(result.code).toBe('forbidden')
  })

  it('DomainAdmin updates a service belonging to the caller domain', async () => {
    asMock(CustomService.findById).mockResolvedValueOnce({
      _id: serviceId,
      domain: ownDomainId,
    })
    asMock(CustomService.findOne).mockResolvedValueOnce(null)
    asMock(CustomService.findByIdAndUpdate).mockResolvedValueOnce({
      toObject: () => ({ _id: serviceId, name: 'Renamed' }),
    })

    const result = await updateCustomService(
      String(serviceId),
      { name: 'Renamed', domainId: String(ownDomainId) },
      ctxDomain
    )

    expect(result.ok).toBe(true)
    expect(asMock(CustomService.findByIdAndUpdate)).toHaveBeenCalled()
  })

  it('DomainAdmin updates a legacy service in place without cloning', async () => {
    asMock(CustomService.findById).mockResolvedValueOnce({
      _id: serviceId,
      domain: undefined,
    })
    asMock(CustomService.findOne).mockResolvedValueOnce(null)
    asMock(CustomService.findByIdAndUpdate).mockResolvedValueOnce({
      toObject: () => ({ _id: serviceId, name: 'Renamed' }),
    })

    const result = await updateCustomService(
      String(serviceId),
      { name: 'Renamed', domainId: String(ownDomainId) },
      ctxDomain
    )

    expect(result.ok).toBe(true)
    expect(asMock(CustomService.findByIdAndUpdate)).toHaveBeenCalled()
    expect(asMock(CustomService.create)).not.toHaveBeenCalled()
    const uniqFilter = asMock(CustomService.findOne).mock.calls[0][0]
    expect(uniqFilter.$or).toBeDefined()
  })

  it('GlobalAdmin updates a per-domain service in place, ignoring domainId', async () => {
    asMock(CustomService.findById).mockResolvedValueOnce({
      _id: serviceId,
      domain: otherDomainId,
    })
    asMock(CustomService.findOne).mockResolvedValueOnce(null)
    asMock(CustomService.findByIdAndUpdate).mockResolvedValueOnce({
      toObject: () => ({ _id: serviceId, name: 'Renamed' }),
    })

    const result = await updateCustomService(
      String(serviceId),
      { name: 'Renamed' },
      ctxGlobal
    )

    expect(result.ok).toBe(true)
    expect(asMock(CustomService.findByIdAndUpdate)).toHaveBeenCalledWith(
      String(serviceId),
      expect.objectContaining({ name: 'Renamed' }),
      expect.any(Object)
    )
    expect(asMock(CustomService.create)).not.toHaveBeenCalled()
  })

  it('GlobalAdmin updates a legacy service in place without cloning', async () => {
    asMock(CustomService.findById).mockResolvedValueOnce({
      _id: serviceId,
      domain: undefined,
    })
    asMock(CustomService.findOne).mockResolvedValueOnce(null)
    asMock(CustomService.findByIdAndUpdate).mockResolvedValueOnce({
      toObject: () => ({ _id: serviceId, name: 'Renamed' }),
    })

    const result = await updateCustomService(
      String(serviceId),
      { name: 'Renamed' },
      ctxGlobal
    )

    expect(result.ok).toBe(true)
    expect(asMock(CustomService.findByIdAndUpdate)).toHaveBeenCalled()
    expect(asMock(CustomService.create)).not.toHaveBeenCalled()
    // Uniqueness filter should use global $or, not domain:
    const uniqFilter = asMock(CustomService.findOne).mock.calls[0][0]
    expect(uniqFilter.$or).toBeDefined()
    expect(uniqFilter.domain).toBeUndefined()
  })
})

describe('deleteCustomService', () => {
  it('returns not_found when service missing', async () => {
    asMock(CustomService.findById).mockResolvedValueOnce(null)
    const result = await deleteCustomService(
      String(serviceId),
      { domainId: String(ownDomainId) },
      ctxGlobal
    )
    expect(result.ok).toBe(false)
    if (isServiceErr(result)) expect(result.code).toBe('not_found')
  })

  it('refuses DomainAdmin to delete service from another domain', async () => {
    asMock(CustomService.findById).mockResolvedValueOnce({
      _id: serviceId,
      domain: otherDomainId,
    })
    const result = await deleteCustomService(
      String(serviceId),
      { domainId: String(ownDomainId) },
      ctxDomain
    )
    expect(result.ok).toBe(false)
    if (isServiceErr(result)) expect(result.code).toBe('forbidden')
    expect(asMock(CustomService.findByIdAndDelete)).not.toHaveBeenCalled()
  })

  it('DomainAdmin deletes own-domain service', async () => {
    asMock(CustomService.findById).mockResolvedValueOnce({
      _id: serviceId,
      domain: ownDomainId,
    })
    asMock(CustomService.findByIdAndDelete).mockResolvedValueOnce({})

    const result = await deleteCustomService(
      String(serviceId),
      { domainId: String(ownDomainId) },
      ctxDomain
    )
    expect(result.ok).toBe(true)
    expect(asMock(CustomService.findByIdAndDelete)).toHaveBeenCalledWith(
      String(serviceId)
    )
  })

  it('DomainAdmin deletes a legacy service outright (no unlink)', async () => {
    asMock(CustomService.findById).mockResolvedValueOnce({
      _id: serviceId,
      domain: undefined,
    })
    asMock(CustomService.findByIdAndDelete).mockResolvedValueOnce({})

    const result = await deleteCustomService(
      String(serviceId),
      { domainId: String(ownDomainId) },
      ctxDomain
    )
    expect(result.ok).toBe(true)
    expect(asMock(CustomService.findByIdAndDelete)).toHaveBeenCalledWith(
      String(serviceId)
    )
    expect(asMock(Domain.updateOne)).not.toHaveBeenCalled()
  })

  it('GlobalAdmin deletes a per-domain service from any domain', async () => {
    asMock(CustomService.findById).mockResolvedValueOnce({
      _id: serviceId,
      domain: otherDomainId,
    })
    asMock(CustomService.findByIdAndDelete).mockResolvedValueOnce({})

    const result = await deleteCustomService(
      String(serviceId),
      { domainId: String(ownDomainId) },
      ctxGlobal
    )

    expect(result.ok).toBe(true)
    expect(asMock(CustomService.findByIdAndDelete)).toHaveBeenCalledWith(
      String(serviceId)
    )
    // Cascade: detach service ID from the service's own domain groups
    // and from every RealEstate of that domain.
    expect(asMock(Domain.updateOne)).toHaveBeenCalledWith(
      { _id: otherDomainId },
      { $pull: { 'customServices.$[].services': String(serviceId) } }
    )
    expect(asMock(RealEstate.updateMany)).toHaveBeenCalledWith(
      { domain: otherDomainId },
      { $pull: { customServices: { _id: String(serviceId) } } }
    )
  })

  it('GlobalAdmin deletes a legacy service outright, not unlink', async () => {
    asMock(CustomService.findById).mockResolvedValueOnce({
      _id: serviceId,
      domain: undefined,
    })
    asMock(CustomService.findByIdAndDelete).mockResolvedValueOnce({})

    const result = await deleteCustomService(
      String(serviceId),
      { domainId: undefined },
      ctxGlobal
    )

    expect(result.ok).toBe(true)
    expect(asMock(CustomService.findByIdAndDelete)).toHaveBeenCalledWith(
      String(serviceId)
    )
    expect(asMock(Domain.updateOne)).not.toHaveBeenCalled()
  })
})

describe('listCustomServicesForDomain', () => {
  const findMock = () => {
    const lean = jest.fn().mockResolvedValue([{ _id: 'a' }])
    asMock(CustomService.find).mockReturnValueOnce({ lean })
    return lean
  }

  it('rejects user callers with 400 invalid', async () => {
    const result = await listCustomServicesForDomain(
      { domainId: String(ownDomainId) },
      ctxUser
    )
    expect(result.ok).toBe(false)
    if (isServiceErr(result)) {
      expect(result.code).toBe('invalid')
      expect(result.message).toBe('Не дозволено')
    }
  })

  it('returns everything for admin without domainId', async () => {
    findMock()
    const result = await listCustomServicesForDomain({}, ctxGlobal)
    expect(result.ok).toBe(true)
    expect(asMock(CustomService.find)).toHaveBeenCalledWith({})
  })

  it('returns own-domain + all legacy when domainId given without templateCategory', async () => {
    findMock()
    await listCustomServicesForDomain(
      { domainId: String(ownDomainId) },
      ctxGlobal
    )
    const filter = asMock(CustomService.find).mock.calls[0][0]
    expect(Array.isArray(filter.$or)).toBe(true)
    expect(filter.$or).toHaveLength(3)
    expect(asMock(getDefaultServiceIdsForCategory)).not.toHaveBeenCalled()
  })

  it('returns own-domain + category defaults when templateCategory given', async () => {
    const defaultId = new mongoose.Types.ObjectId()
    asMock(getDefaultServiceIdsForCategory).mockResolvedValueOnce([
      String(defaultId),
    ])
    findMock()

    await listCustomServicesForDomain(
      { domainId: String(ownDomainId), templateCategory: 'utility' },
      ctxGlobal
    )

    expect(asMock(getDefaultServiceIdsForCategory)).toHaveBeenCalledWith(
      'utility'
    )
    const filter = asMock(CustomService.find).mock.calls[0][0]
    expect(filter.$or).toHaveLength(2)
    expect(filter.$or[0]).toEqual({ domain: expect.anything() })
    expect(filter.$or[1].$in).toBeUndefined() // wrapped in _id: { $in }
    expect(filter.$or[1]).toEqual({ _id: { $in: expect.any(Array) } })
  })

  it('omits the defaults clause when category has no built-in templates', async () => {
    asMock(getDefaultServiceIdsForCategory).mockResolvedValueOnce([])
    findMock()
    await listCustomServicesForDomain(
      { domainId: String(ownDomainId), templateCategory: 'it' },
      ctxGlobal
    )
    const filter = asMock(CustomService.find).mock.calls[0][0]
    expect(filter.$or).toHaveLength(1)
    expect(filter.$or[0]).toEqual({ domain: expect.anything() })
  })

  it('rejects invalid domainId', async () => {
    const result = await listCustomServicesForDomain(
      { domainId: 'not-an-objectid' },
      ctxGlobal
    )
    expect(result.ok).toBe(false)
    if (isServiceErr(result)) expect(result.code).toBe('invalid')
    expect(asMock(CustomService.find)).not.toHaveBeenCalled()
  })

  it('combines explicit ids with the domain filter', async () => {
    findMock()
    const validId = new mongoose.Types.ObjectId().toString()
    await listCustomServicesForDomain(
      { domainId: String(ownDomainId), ids: validId },
      ctxGlobal
    )
    const filter = asMock(CustomService.find).mock.calls[0][0]
    expect(filter._id).toEqual({ $in: [validId] })
  })

  it('returns empty array if all explicit ids are invalid', async () => {
    const result = await listCustomServicesForDomain(
      { ids: 'foo,bar' },
      ctxGlobal
    )
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toEqual([])
    expect(asMock(CustomService.find)).not.toHaveBeenCalled()
  })
})
