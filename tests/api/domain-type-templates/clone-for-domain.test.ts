import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import DomainTypeTemplate from '@modules/models/domain-type-template'
import handler from '@pages/api/domain-type-templates/[id]/clone-for-domain'
import { getCurrentUser } from '@utils/getCurrentUser'

jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@modules/models/CustomService', () => ({
  __esModule: true,
  default: { find: jest.fn(), create: jest.fn() },
}))

jest.mock('@modules/models/Domain', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}))

jest.mock('@modules/models/domain-type-template', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}))

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

const TPL_ID = '64d68421d9ba2fc8fea79d11'
const DOMAIN_ID = '74d68421d9ba2fc8fea79d22'
const SVC_A = '84d68421d9ba2fc8fea79d33'
const SVC_B = '94d68421d9ba2fc8fea79d44'
const NEW_A = 'a4d68421d9ba2fc8fea79d55'
const NEW_B = 'b4d68421d9ba2fc8fea79d66'

const makeRes = () => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}

const asAdmin = () =>
  (getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: true })

beforeEach(() => {
  jest.clearAllMocks()
})

describe('POST /api/domain-type-templates/[id]/clone-for-domain', () => {
  it('returns 405 for non-POST', async () => {
    asAdmin()
    const req = {
      method: 'GET',
      query: { id: TPL_ID },
      body: { domainId: DOMAIN_ID },
    } as any
    const res = makeRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 403 for non-admin', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: false })
    const req = {
      method: 'POST',
      query: { id: TPL_ID },
      body: { domainId: DOMAIN_ID },
    } as any
    const res = makeRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('returns 400 on invalid template id', async () => {
    asAdmin()
    const req = {
      method: 'POST',
      query: { id: 'bad' },
      body: { domainId: DOMAIN_ID },
    } as any
    const res = makeRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 on invalid domainId', async () => {
    asAdmin()
    const req = {
      method: 'POST',
      query: { id: TPL_ID },
      body: { domainId: 'bad' },
    } as any
    const res = makeRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 404 when template missing', async () => {
    asAdmin()
    ;(DomainTypeTemplate.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    })
    const req = {
      method: 'POST',
      query: { id: TPL_ID },
      body: { domainId: DOMAIN_ID },
    } as any
    const res = makeRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('returns 404 when domain missing', async () => {
    asAdmin()
    ;(DomainTypeTemplate.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: TPL_ID, groups: [] }),
    })
    ;(Domain.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    })
    const req = {
      method: 'POST',
      query: { id: TPL_ID },
      body: { domainId: DOMAIN_ID },
    } as any
    const res = makeRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('clones every original service into a per-domain copy and returns mapped groups', async () => {
    asAdmin()
    ;(DomainTypeTemplate.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: TPL_ID,
        groups: [
          { groupName: 'G1', serviceIds: [SVC_A, SVC_B] },
          { groupName: 'G2', serviceIds: [SVC_A] }, // dedup test
        ],
      }),
    })
    ;(Domain.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: DOMAIN_ID }),
    })
    ;(CustomService.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          _id: SVC_A,
          name: 'Електро',
          fieldName: 'electricityPrice',
          serviceType: 'electricityPrice',
        },
        {
          _id: SVC_B,
          name: 'Вода',
          fieldName: 'waterPrice',
          serviceType: 'waterPrice',
        },
      ]),
    })
    ;(CustomService.create as jest.Mock)
      .mockResolvedValueOnce({ _id: NEW_A })
      .mockResolvedValueOnce({ _id: NEW_B })

    const req = {
      method: 'POST',
      query: { id: TPL_ID },
      body: { domainId: DOMAIN_ID },
    } as any
    const res = makeRes()
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    // Two unique originals → two creates (dedup worked).
    expect(CustomService.create).toHaveBeenCalledTimes(2)
    // Both clones carry domain set.
    const call0 = (CustomService.create as jest.Mock).mock.calls[0][0]
    const call1 = (CustomService.create as jest.Mock).mock.calls[1][0]
    expect(String(call0.domain)).toBe(DOMAIN_ID)
    expect(String(call1.domain)).toBe(DOMAIN_ID)
    // serviceType preserved.
    expect(call0.serviceType).toBe('electricityPrice')
    expect(call1.serviceType).toBe('waterPrice')

    const { data } = res.json.mock.calls[0][0]
    expect(data.clonedCount).toBe(2)
    expect(data.missingCount).toBe(0)
    // Mapping into groups: G1 has both new ids; G2 reuses the SAME new id for SVC_A.
    expect(data.groups).toEqual([
      { groupName: 'G1', services: [NEW_A, NEW_B] },
      { groupName: 'G2', services: [NEW_A] },
    ])
  })

  it('handles missing originals gracefully (counts and skips)', async () => {
    asAdmin()
    ;(DomainTypeTemplate.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: TPL_ID,
        groups: [{ groupName: 'G', serviceIds: [SVC_A, SVC_B] }],
      }),
    })
    ;(Domain.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: DOMAIN_ID }),
    })
    // SVC_A exists, SVC_B was deleted from DB
    ;(CustomService.find as jest.Mock).mockReturnValue({
      lean: jest
        .fn()
        .mockResolvedValue([{ _id: SVC_A, name: 'X', fieldName: 'x' }]),
    })
    ;(CustomService.create as jest.Mock).mockResolvedValueOnce({ _id: NEW_A })

    const req = {
      method: 'POST',
      query: { id: TPL_ID },
      body: { domainId: DOMAIN_ID },
    } as any
    const res = makeRes()
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    const { data } = res.json.mock.calls[0][0]
    expect(data.clonedCount).toBe(1)
    expect(data.missingCount).toBe(1)
    expect(data.groups).toEqual([{ groupName: 'G', services: [NEW_A] }])
  })

  it('handles empty template (no groups) without crashing', async () => {
    asAdmin()
    ;(DomainTypeTemplate.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: TPL_ID, groups: [] }),
    })
    ;(Domain.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: DOMAIN_ID }),
    })

    const req = {
      method: 'POST',
      query: { id: TPL_ID },
      body: { domainId: DOMAIN_ID },
    } as any
    const res = makeRes()
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    const { data } = res.json.mock.calls[0][0]
    expect(data.groups).toEqual([])
    expect(data.clonedCount).toBe(0)
    expect(CustomService.create).not.toHaveBeenCalled()
  })
})
