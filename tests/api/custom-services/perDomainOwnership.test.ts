// @ts-nocheck
import handler from '@pages/api/custom-services'
import { getCurrentUser } from '@utils/getCurrentUser'

jest.mock('@pages/api/api.config', () => jest.fn())

jest.mock('@modules/models/CustomService', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}))

jest.mock('@modules/models/Domain', () => ({
  __esModule: true,
  default: {
    updateOne: jest.fn(),
  },
}))

jest.mock('@modules/models/RealEstate', () => ({
  __esModule: true,
  default: {
    updateMany: jest.fn(),
  },
}))

import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

const VALID_DOMAIN = '64d68421d9ba2fc8fea79d11'
const OTHER_DOMAIN = '74d68421d9ba2fc8fea79d22'

const makeRes = () => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(getCurrentUser as jest.Mock).mockResolvedValue({
    isGlobalAdmin: true,
    isDomainAdmin: false,
    isUser: false,
  })
  ;(Domain.updateOne as jest.Mock).mockResolvedValue({
    acknowledged: true,
    matchedCount: 1,
  })
  ;(RealEstate.updateMany as jest.Mock).mockResolvedValue({
    acknowledged: true,
  })
})

describe('POST /api/custom-services — per-domain name uniqueness', () => {
  it('allows same name in different domains', async () => {
    // Domain A already has "Електро". When domain B tries to create one,
    // findOne is called with `{ name, domain: B }` → no match → create.
    ;(CustomService.findOne as jest.Mock).mockResolvedValue(null)
    ;(CustomService.create as jest.Mock).mockImplementation(async (doc) => ({
      ...doc,
      _id: 'new',
      toObject: () => ({ ...doc, _id: 'new' }),
    }))

    const req = {
      method: 'POST',
      query: {},
      body: { name: 'Електро', domainId: VALID_DOMAIN },
    } as any
    const res = makeRes()
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    const filter = (CustomService.findOne as jest.Mock).mock.calls[0][0]
    expect(String(filter.domain)).toBe(VALID_DOMAIN)
    expect(filter.name.$regex).toBe('^Електро$')
  })

  it('rejects duplicate name within the SAME domain (409)', async () => {
    ;(CustomService.findOne as jest.Mock).mockResolvedValue({
      _id: 'existing',
      name: 'Електро',
    })

    const req = {
      method: 'POST',
      query: {},
      body: { name: 'Електро', domainId: VALID_DOMAIN },
    } as any
    const res = makeRes()
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(CustomService.create).not.toHaveBeenCalled()
  })

  it('global pool uniqueness uses $or domain-null filter', async () => {
    ;(CustomService.findOne as jest.Mock).mockResolvedValue(null)
    ;(CustomService.create as jest.Mock).mockImplementation(async (doc) => ({
      ...doc,
      _id: 'new',
      toObject: () => ({ ...doc, _id: 'new' }),
    }))

    const req = {
      method: 'POST',
      query: {},
      body: { name: 'Глобальна', domainId: '' },
    } as any
    const res = makeRes()
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    const filter = (CustomService.findOne as jest.Mock).mock.calls[0][0]
    expect(filter.$or).toBeDefined()
    expect(filter.domain).toBeUndefined()
  })
})

describe('POST /api/custom-services — per-domain ownership', () => {
  it('saves the service with domain set when body.domainId is a valid id', async () => {
    ;(CustomService.findOne as jest.Mock).mockResolvedValue(null)
    ;(CustomService.create as jest.Mock).mockImplementation(async (doc) => ({
      ...doc,
      _id: 'new',
      toObject: () => ({ ...doc, _id: 'new' }),
    }))

    const req = {
      method: 'POST',
      query: {},
      body: { name: 'Електропостачання', domainId: VALID_DOMAIN },
    } as any
    const res = makeRes()
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    const arg = (CustomService.create as jest.Mock).mock.calls[0][0]
    expect(String(arg.domain)).toBe(VALID_DOMAIN)
  })

  it('creates a global service (no domain) when body.domainId is empty', async () => {
    ;(CustomService.findOne as jest.Mock).mockResolvedValue(null)
    ;(CustomService.create as jest.Mock).mockImplementation(async (doc) => ({
      ...doc,
      _id: 'new',
      toObject: () => ({ ...doc, _id: 'new' }),
    }))

    const req = {
      method: 'POST',
      query: {},
      body: { name: 'Глобальна', domainId: '' },
    } as any
    const res = makeRes()
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    const arg = (CustomService.create as jest.Mock).mock.calls[0][0]
    expect(arg.domain).toBeUndefined()
  })

  it('rejects invalid domainId', async () => {
    ;(CustomService.findOne as jest.Mock).mockResolvedValue(null)

    const req = {
      method: 'POST',
      query: {},
      body: { name: 'Bad', domainId: 'not-an-objectid' },
    } as any
    const res = makeRes()
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(CustomService.create).not.toHaveBeenCalled()
  })
})

describe('GET /api/custom-services — per-domain filter', () => {
  it('returns everything when no domainId query (admin/global view)', async () => {
    const lean = jest.fn().mockResolvedValue([{ _id: 'a' }])
    ;(CustomService.find as jest.Mock).mockReturnValue({ lean })

    const req = { method: 'GET', query: {}, body: {} } as any
    const res = makeRes()
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(CustomService.find).toHaveBeenCalledWith({})
  })

  it('filters by domain (owned + globals) when domainId provided', async () => {
    const lean = jest.fn().mockResolvedValue([{ _id: 'a' }])
    ;(CustomService.find as jest.Mock).mockReturnValue({ lean })

    const req = {
      method: 'GET',
      query: { domainId: VALID_DOMAIN },
      body: {},
    } as any
    const res = makeRes()
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const filter = (CustomService.find as jest.Mock).mock.calls[0][0]
    // Filter should be an $or with domain match + globals
    expect(filter.$or).toBeDefined()
    expect(Array.isArray(filter.$or)).toBe(true)
    const ownedClause = filter.$or.find(
      (clause: any) =>
        clause.domain && !clause.domain.$in && !clause.domain.$exists
    )
    expect(ownedClause).toBeDefined()
    expect(String(ownedClause.domain)).toBe(VALID_DOMAIN)
  })

  it('returns 400 for invalid domainId in GET', async () => {
    const req = {
      method: 'GET',
      query: { domainId: 'not-an-objectid' },
      body: {},
    } as any
    const res = makeRes()
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(CustomService.find).not.toHaveBeenCalled()
  })

  it('combines domain filter with explicit _id list', async () => {
    const lean = jest.fn().mockResolvedValue([])
    ;(CustomService.find as jest.Mock).mockReturnValue({ lean })

    const req = {
      method: 'GET',
      query: { domainId: VALID_DOMAIN, _id: VALID_DOMAIN },
      body: {},
    } as any
    const res = makeRes()
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const filter = (CustomService.find as jest.Mock).mock.calls[0][0]
    expect(filter.$or).toBeDefined()
    expect(filter._id).toBeDefined()
    expect(filter._id.$in).toContain(VALID_DOMAIN)
  })

  it('domain owners are isolated: domain A request does not return services owned by domain B', async () => {
    // We can't directly verify isolation without a real DB; instead, verify
    // that the filter passed to .find() correctly limits to "owned by A OR
    // global" — i.e. it does NOT match services owned by B (which would have
    // `domain: <B-id>`).
    const lean = jest.fn().mockResolvedValue([])
    ;(CustomService.find as jest.Mock).mockReturnValue({ lean })

    const req = {
      method: 'GET',
      query: { domainId: VALID_DOMAIN },
      body: {},
    } as any
    const res = makeRes()
    await handler(req, res)

    const filter = (CustomService.find as jest.Mock).mock.calls[0][0]
    // Build a fake service owned by OTHER_DOMAIN and check it would not match.
    // Without a Mongo executor we just assert that none of the $or clauses
    // would resolve to "any domain" — i.e. we never use {} as a fallback.
    const wouldMatchOtherDomain = filter.$or.some((clause: any) => {
      if (clause.domain && String(clause.domain) === OTHER_DOMAIN) return true
      if (clause.domain?.$in?.includes(OTHER_DOMAIN)) return true
      return false
    })
    expect(wouldMatchOtherDomain).toBe(false)
  })
})
