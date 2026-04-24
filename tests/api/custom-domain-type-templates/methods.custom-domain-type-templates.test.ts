// @ts-nocheck
import CustomDomainTypeTemplate from '@modules/models/custom-domain-type-template'
import handler from '@pages/api/custom-domain-type-templates'
import { getCurrentUser } from '@utils/getCurrentUser'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'

jest.mock('@pages/api/api.config', () => jest.fn())

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

setupTestEnvironment()

describe('API custom-domain-type-templates', () => {
  beforeEach(async () => {
    await CustomDomainTypeTemplate.deleteMany({})
    jest.clearAllMocks()
  })

  it('GET returns 403 when user is not admin', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: false })

    const req = { method: 'GET' } as any
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    } as any

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    )
  })

  it('GET returns sorted templates for admin', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: true })
    await CustomDomainTypeTemplate.create({
      typeLabel: 'B',
      groupName: 'G2',
    })
    await CustomDomainTypeTemplate.create({
      typeLabel: 'A',
      groupName: 'G1',
    })

    const req = { method: 'GET' } as any
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    } as any

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const { data } = res.json.mock.calls[0][0]
    expect(data).toHaveLength(2)
    expect(data[0].typeLabel).toBe('A')
    expect(data[1].typeLabel).toBe('B')
  })

  it('POST creates template for admin', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: true })

    const req = {
      method: 'POST',
      body: { typeLabel: 'Тип', groupName: 'Група' },
    } as any
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    } as any

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    const doc = await CustomDomainTypeTemplate.findOne({
      typeLabel: 'Тип',
      groupName: 'Група',
    }).lean()
    expect(doc).toBeTruthy()
  })

  it('POST returns existing doc when duplicate pair', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: true })
    const existing = await CustomDomainTypeTemplate.create({
      typeLabel: 'X',
      groupName: 'Y',
    })

    const req = {
      method: 'POST',
      body: { typeLabel: 'X', groupName: 'Y' },
    } as any
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    } as any

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const body = res.json.mock.calls[0][0]
    expect(body.duplicate).toBe(true)
    expect(String(body.data._id)).toBe(String(existing._id))
    const count = await CustomDomainTypeTemplate.countDocuments()
    expect(count).toBe(1)
  })

  it('POST returns 400 when labels missing', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: true })

    const req = {
      method: 'POST',
      body: { typeLabel: '', groupName: '' },
    } as any
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    } as any

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 405 for unsupported method', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: true })

    const req = { method: 'DELETE' } as any
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    } as any

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(405)
  })
})
