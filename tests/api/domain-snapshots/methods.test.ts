import Domain from '@modules/models/Domain'
import DomainTypeTemplate from '@modules/models/domain-type-template'
import DomainCustomServicesSnapshot from '@modules/models/domain-custom-services-snapshot'
import indexHandler from '@pages/api/domain-snapshots'
import idHandler from '@pages/api/domain-snapshots/[id]'
import restoreHandler from '@pages/api/domain-snapshots/[id]/restore'
import { getCurrentUser } from '@utils/getCurrentUser'

jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@modules/models/Domain', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}))

jest.mock('@modules/models/domain-type-template', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}))

jest.mock('@modules/models/domain-custom-services-snapshot', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
  },
  DOMAIN_SNAPSHOT_REASONS: ['template-switch', 'manual'],
}))

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

const VALID_ID = '64d68421d9ba2fc8fea79d11'
const OTHER_ID = '74d68421d9ba2fc8fea79d22'

const makeRes = () => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  res.writableEnded = false
  return res
}

const asAdmin = () =>
  (getCurrentUser as jest.Mock).mockResolvedValue({
    isAdmin: true,
    user: { _id: 'user-1' },
  })

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/domain-snapshots', () => {
  it('returns 403 for non-admin', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: false })
    const req = {
      method: 'GET',
      query: { domainId: VALID_ID },
      body: {},
    } as any
    const res = makeRes()
    await indexHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('returns 400 for invalid domainId', async () => {
    asAdmin()
    const req = { method: 'GET', query: { domainId: 'bad' }, body: {} } as any
    const res = makeRes()
    await indexHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns sorted, limited list', async () => {
    asAdmin()
    const limit = jest.fn(() => ({
      lean: jest.fn().mockResolvedValue([{ _id: 's1' }]),
    }))
    const sort = jest.fn(() => ({ limit }))
    ;(DomainCustomServicesSnapshot.find as jest.Mock).mockReturnValue({ sort })

    const req = {
      method: 'GET',
      query: { domainId: VALID_ID, limit: '5' },
      body: {},
    } as any
    const res = makeRes()
    await indexHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 })
    expect(limit).toHaveBeenCalledWith(5)
  })
})

describe('POST /api/domain-snapshots', () => {
  it('returns 404 when domain missing', async () => {
    asAdmin()
    ;(Domain.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    })
    const req = {
      method: 'POST',
      query: {},
      body: { domainId: VALID_ID },
    } as any
    const res = makeRes()
    await indexHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('returns 400 when domain has empty customServices', async () => {
    asAdmin()
    ;(Domain.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: VALID_ID, customServices: [] }),
    })
    const req = {
      method: 'POST',
      query: {},
      body: { domainId: VALID_ID },
    } as any
    const res = makeRes()
    await indexHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('creates snapshot with denormalized templateName', async () => {
    asAdmin()
    ;(Domain.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: VALID_ID,
        domainTypeTemplateId: OTHER_ID,
        customServices: [{ groupName: 'G', services: ['s1'] }],
      }),
    })
    ;(DomainTypeTemplate.findById as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        lean: jest.fn().mockResolvedValue({ name: 'IT' }),
      })),
    })
    ;(DomainCustomServicesSnapshot.create as jest.Mock).mockResolvedValue({
      _id: 'new-snap',
    })

    const req = {
      method: 'POST',
      query: {},
      body: { domainId: VALID_ID, reason: 'template-switch' },
    } as any
    const res = makeRes()
    await indexHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    const arg = (DomainCustomServicesSnapshot.create as jest.Mock).mock
      .calls[0][0]
    expect(arg.templateName).toBe('IT')
    expect(arg.reason).toBe('template-switch')
    expect(arg.groups).toEqual([{ groupName: 'G', services: ['s1'] }])
    expect(arg.createdBy).toBe('user-1')
  })

  it('uses explicit groups/templateId/templateName from body when provided', async () => {
    asAdmin()
    // Domain has DIFFERENT state in DB; we want body to win.
    ;(Domain.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: VALID_ID,
        domainTypeTemplateId: undefined,
        customServices: [],
      }),
    })
    ;(DomainCustomServicesSnapshot.create as jest.Mock).mockResolvedValue({
      _id: 'new-snap',
    })

    const req = {
      method: 'POST',
      query: {},
      body: {
        domainId: VALID_ID,
        reason: 'template-switch',
        groups: [{ groupName: 'Custom', services: ['sX', 'sY'] }],
        templateId: '64d68421d9ba2fc8fea79d22',
        templateName: 'Edge Case',
      },
    } as any
    const res = makeRes()
    await indexHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    const arg = (DomainCustomServicesSnapshot.create as jest.Mock).mock
      .calls[0][0]
    expect(arg.groups).toEqual([
      { groupName: 'Custom', services: ['sX', 'sY'] },
    ])
    expect(String(arg.templateId)).toBe('64d68421d9ba2fc8fea79d22')
    expect(arg.templateName).toBe('Edge Case')
    // Should NOT have called DomainTypeTemplate.findById since templateName given.
    expect(DomainTypeTemplate.findById).not.toHaveBeenCalled()
  })

  it('rejects invalid templateId in body', async () => {
    asAdmin()
    ;(Domain.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: VALID_ID,
        customServices: [{ groupName: 'G', services: ['s1'] }],
      }),
    })
    const req = {
      method: 'POST',
      query: {},
      body: { domainId: VALID_ID, templateId: 'not-an-id' },
    } as any
    const res = makeRes()
    await indexHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('treats explicit templateId=null as "no template"', async () => {
    asAdmin()
    ;(Domain.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: VALID_ID,
        domainTypeTemplateId: OTHER_ID,
        customServices: [],
      }),
    })
    ;(DomainCustomServicesSnapshot.create as jest.Mock).mockResolvedValue({
      _id: 'new-snap',
    })

    const req = {
      method: 'POST',
      query: {},
      body: {
        domainId: VALID_ID,
        groups: [{ groupName: 'G', services: ['s1'] }],
        templateId: null,
      },
    } as any
    const res = makeRes()
    await indexHandler(req, res)

    const arg = (DomainCustomServicesSnapshot.create as jest.Mock).mock
      .calls[0][0]
    expect(arg.templateId).toBeNull()
    expect(arg.templateName).toBeNull()
  })

  it('rejects invalid groups shape', async () => {
    asAdmin()
    ;(Domain.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: VALID_ID,
        customServices: [{ groupName: 'G', services: ['s1'] }],
      }),
    })
    const req = {
      method: 'POST',
      query: {},
      body: {
        domainId: VALID_ID,
        groups: [{ groupName: '', services: ['s1'] }],
      },
    } as any
    const res = makeRes()
    await indexHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('falls back reason to manual when invalid', async () => {
    asAdmin()
    ;(Domain.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: VALID_ID,
        customServices: [{ groupName: 'G', services: ['s1'] }],
      }),
    })
    ;(DomainCustomServicesSnapshot.create as jest.Mock).mockResolvedValue({
      _id: 'new-snap',
    })

    const req = {
      method: 'POST',
      query: {},
      body: { domainId: VALID_ID, reason: 'noise' },
    } as any
    const res = makeRes()
    await indexHandler(req, res)

    const arg = (DomainCustomServicesSnapshot.create as jest.Mock).mock
      .calls[0][0]
    expect(arg.reason).toBe('manual')
  })
})

describe('DELETE /api/domain-snapshots/[id]', () => {
  it('returns 404 when snapshot missing', async () => {
    asAdmin()
    ;(
      DomainCustomServicesSnapshot.findByIdAndDelete as jest.Mock
    ).mockResolvedValue(null)
    const req = {
      method: 'DELETE',
      query: { id: VALID_ID },
      body: {},
    } as any
    const res = makeRes()
    await idHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('returns 200 on successful delete', async () => {
    asAdmin()
    ;(
      DomainCustomServicesSnapshot.findByIdAndDelete as jest.Mock
    ).mockResolvedValue({ _id: VALID_ID })
    const req = {
      method: 'DELETE',
      query: { id: VALID_ID },
      body: {},
    } as any
    const res = makeRes()
    await idHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    const { data } = res.json.mock.calls[0][0]
    expect(data.deleted).toBe(true)
  })
})

describe('POST /api/domain-snapshots/[id]/restore', () => {
  it('returns 405 for non-POST', async () => {
    asAdmin()
    const req = {
      method: 'GET',
      query: { id: VALID_ID },
      body: {},
    } as any
    const res = makeRes()
    await restoreHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 404 when snapshot missing', async () => {
    asAdmin()
    ;(DomainCustomServicesSnapshot.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    })
    const req = {
      method: 'POST',
      query: { id: VALID_ID },
      body: {},
    } as any
    const res = makeRes()
    await restoreHandler(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('writes snapshot groups back to domain', async () => {
    asAdmin()
    ;(DomainCustomServicesSnapshot.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: VALID_ID,
        domainId: OTHER_ID,
        templateId: 'tpl-1',
        groups: [{ groupName: 'G', services: ['s1', 's2'] }],
      }),
    })

    const domainDoc: any = {
      customServices: [],
      domainTypeTemplateId: undefined,
      save: jest.fn(async function () {
        return this
      }),
    }
    ;(Domain.findById as jest.Mock).mockResolvedValue(domainDoc)

    const req = {
      method: 'POST',
      query: { id: VALID_ID },
      body: {},
    } as any
    const res = makeRes()
    await restoreHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(domainDoc.customServices).toEqual([
      { groupName: 'G', services: ['s1', 's2'] },
    ])
    expect(domainDoc.domainTypeTemplateId).toBe('tpl-1')
    expect(domainDoc.save).toHaveBeenCalled()
  })
})
