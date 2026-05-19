import mongoose from 'mongoose'
import {
  createCustomService,
  deleteCustomService,
  isServiceErr,
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
  },
}))

jest.mock('@modules/models/Domain', () => ({
  __esModule: true,
  default: {
    exists: jest.fn(),
    updateOne: jest.fn(),
  },
}))

import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'

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
  asMock(Domain.updateOne).mockResolvedValue({ acknowledged: true })
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
      toObject: () => ({ _id: 'new', name: 'Foo', domain: ownDomainId }),
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
    expect(asMock(Domain.updateOne)).not.toHaveBeenCalled()
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
