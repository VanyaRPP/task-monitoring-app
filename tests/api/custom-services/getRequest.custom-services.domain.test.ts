// @ts-nocheck
import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import handler from '@pages/api/custom-services/domain'
import { getCurrentUser } from '@utils/getCurrentUser'
import { defaultServices } from '@utils/constants'

jest.mock('@pages/api/api.config', () => jest.fn())

jest.mock('@modules/models/Domain', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}))

jest.mock('@modules/models/CustomService', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}))

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

const mockLean = (doc: any) => ({
  lean: jest.fn().mockResolvedValue(doc),
})

describe('API GET custom-services/domain', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      isGlobalAdmin: true,
      isDomainAdmin: false,
      isUser: false,
    })
    // Default: no services in the domain catalog. Individual tests override
    // when they care about the catalog response.
    ;(CustomService.find as jest.Mock).mockReturnValue(mockLean([]))
  })

  it('returns 400 when domainId missing', async () => {
    const req = { method: 'GET', query: {} } as any
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    } as any

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 404 when domain not found', async () => {
    ;(Domain.findById as jest.Mock).mockReturnValue(mockLean(null))

    const req = {
      method: 'GET',
      query: { domainId: '64d68421d9ba2fc8fea79d11' },
    } as any
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    } as any

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('returns empty array when customServices empty', async () => {
    ;(Domain.findById as jest.Mock).mockReturnValue(
      mockLean({
        _id: '64d68421d9ba2fc8fea79d11',
        customServices: [],
      })
    )

    const req = {
      method: 'GET',
      query: { domainId: '64d68421d9ba2fc8fea79d11' },
    } as any
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    } as any

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const { data } = res.json.mock.calls[0][0]
    expect(data).toEqual([])
  })

  it('returns groups with empty services when ids invalid; fallback groupName', async () => {
    ;(Domain.findById as jest.Mock).mockReturnValue(
      mockLean({
        _id: '64d68421d9ba2fc8fea79d11',
        customServices: [
          { groupName: undefined, services: ['not-an-objectid'] },
        ],
      })
    )

    const req = {
      method: 'GET',
      query: { domainId: '64d68421d9ba2fc8fea79d11' },
    } as any
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    } as any

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const { data } = res.json.mock.calls[0][0]
    expect(data[0].groupName).toBe('Група 1')
    expect(data[0].services).toEqual([])
  })

  it('resolves custom services by id', async () => {
    const sid = defaultServices[0]
    ;(Domain.findById as jest.Mock).mockReturnValue(
      mockLean({
        _id: '64d68421d9ba2fc8fea79d11',
        customServices: [{ groupName: 'G', services: [sid] }],
      })
    )

    const row = { _id: sid, name: 'Utility' }
    ;(CustomService.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue([row]),
    })

    const req = {
      method: 'GET',
      query: { domainId: '64d68421d9ba2fc8fea79d11' },
    } as any
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    } as any

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const { data } = res.json.mock.calls[0][0]
    expect(data[0].services).toHaveLength(1)
    expect(data[0].services[0].name).toBe('Utility')
  })
})
