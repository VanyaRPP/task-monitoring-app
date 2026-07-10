// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import DomainTypeTemplate from '@modules/models/domain-type-template'
import handler from '@pages/api/domain-type-templates'
import { getCurrentUser } from '@utils/getCurrentUser'

jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@modules/models/domain-type-template', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  DOMAIN_TYPE_TEMPLATE_CATEGORIES: [
    'utility',
    'it',
    'edu',
    'auto',
    'real-estate',
    'other',
  ],
}))

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

const makeRes = () => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  res.writableEnded = false
  return res
}

const asAdmin = () =>
  (getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: true })
const asNonAdmin = () =>
  (getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: false })

beforeEach(() => {
  jest.clearAllMocks()
})

describe('API /api/domain-type-templates', () => {
  describe('GET', () => {
    it('allows non-admin to read the catalog (200)', async () => {
      // GET is a public read-only catalog: a brand-new user must be able to
      // list provider-type templates in the invoice quick-create before they
      // become a DomainAdmin. Mutations stay admin-only.
      asNonAdmin()
      const sort = jest.fn(() => ({
        lean: jest.fn().mockResolvedValue([{ name: 'A' }]),
      }))
      ;(DomainTypeTemplate.find as jest.Mock).mockReturnValue({ sort })

      const req = { method: 'GET', body: {}, query: {} } as any
      const res = makeRes()
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      const { data } = res.json.mock.calls[0][0]
      expect(data).toEqual([{ name: 'A' }])
    })

    it('returns sorted list for admin', async () => {
      asAdmin()
      const sort = jest.fn(() => ({
        lean: jest.fn().mockResolvedValue([{ name: 'A' }]),
      }))
      ;(DomainTypeTemplate.find as jest.Mock).mockReturnValue({ sort })

      const req = { method: 'GET', body: {}, query: {} } as any
      const res = makeRes()
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(sort).toHaveBeenCalledWith({ name: 1 })
      const { data } = res.json.mock.calls[0][0]
      expect(data).toEqual([{ name: 'A' }])
    })
  })

  describe('POST', () => {
    it('returns 403 for non-admin', async () => {
      asNonAdmin()
      const req = {
        method: 'POST',
        body: { name: 'X', groups: [{ groupName: 'G', serviceIds: [] }] },
        query: {},
      } as any
      const res = makeRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('returns 400 when name missing', async () => {
      asAdmin()
      const req = { method: 'POST', body: { groups: [] } } as any
      const res = makeRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('returns 400 when groupName missing in a group', async () => {
      asAdmin()
      const req = {
        method: 'POST',
        body: { name: 'X', groups: [{ groupName: '', serviceIds: [] }] },
        query: {},
      } as any
      const res = makeRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('returns 400 when serviceId is not a valid ObjectId', async () => {
      asAdmin()
      const req = {
        method: 'POST',
        body: {
          name: 'X',
          groups: [{ groupName: 'G', serviceIds: ['not-an-id'] }],
        },
        query: {},
      } as any
      const res = makeRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('returns 409 when name already exists', async () => {
      asAdmin()
      ;(DomainTypeTemplate.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'a', name: 'X' }),
      })

      const req = {
        method: 'POST',
        body: { name: 'X', groups: [{ groupName: 'G', serviceIds: [] }] },
        query: {},
      } as any
      const res = makeRes()
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(DomainTypeTemplate.create).not.toHaveBeenCalled()
    })

    it('creates new template (201) with isBuiltIn=false', async () => {
      asAdmin()
      ;(DomainTypeTemplate.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      })
      const created = { _id: 'new', name: 'X', isBuiltIn: false, groups: [] }
      ;(DomainTypeTemplate.create as jest.Mock).mockResolvedValue(created)

      const req = {
        method: 'POST',
        body: { name: '  X  ', groups: [{ groupName: 'G', serviceIds: [] }] },
        query: {},
      } as any
      const res = makeRes()
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(DomainTypeTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'X', isBuiltIn: false })
      )
      const { data } = res.json.mock.calls[0][0]
      expect(data).toBe(created)
    })
  })

  describe('other methods', () => {
    it('returns 405 for unsupported method', async () => {
      asAdmin()
      const req = { method: 'DELETE', body: {}, query: {} } as any
      const res = makeRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(405)
    })
  })
})
