import Domain from '@modules/models/Domain'
import DomainTypeTemplate from '@modules/models/domain-type-template'
import handler from '@pages/api/domain-type-templates/[id]'
import { getCurrentUser } from '@utils/getCurrentUser'

jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@modules/models/domain-type-template', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findOne: jest.fn(),
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

jest.mock('@modules/models/Domain', () => ({
  __esModule: true,
  default: { countDocuments: jest.fn() },
}))

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

const VALID_ID = '64d68421d9ba2fc8fea79d11'

const makeRes = () => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  res.writableEnded = false
  return res
}

const asAdmin = () =>
  (getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: true })

const buildDoc = (overrides: any = {}) => {
  const doc: any = {
    _id: VALID_ID,
    name: 'X',
    category: 'other',
    isBuiltIn: false,
    archivedAt: null,
    groups: [],
    toObject() {
      const { toObject, save, deleteOne, ...rest } = this
      return rest
    },
    save: jest.fn(async function () {
      return this
    }),
    deleteOne: jest.fn(async () => undefined),
    ...overrides,
  }
  return doc
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('API /api/domain-type-templates/[id]', () => {
  describe('common', () => {
    it('returns 400 for invalid id', async () => {
      asAdmin()
      const req = { method: 'GET', query: { id: 'bad' }, body: {} } as any
      const res = makeRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('returns 403 for non-admin', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: false })
      const req = { method: 'GET', query: { id: VALID_ID }, body: {} } as any
      const res = makeRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('returns 404 when template not found', async () => {
      asAdmin()
      ;(DomainTypeTemplate.findById as jest.Mock).mockResolvedValue(null)
      const req = { method: 'GET', query: { id: VALID_ID }, body: {} } as any
      const res = makeRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(404)
    })
  })

  describe('GET', () => {
    it('returns template with usageCount', async () => {
      asAdmin()
      ;(DomainTypeTemplate.findById as jest.Mock).mockResolvedValue(buildDoc())
      ;(Domain.countDocuments as jest.Mock).mockResolvedValue(7)

      const req = { method: 'GET', query: { id: VALID_ID }, body: {} } as any
      const res = makeRes()
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      const { data } = res.json.mock.calls[0][0]
      expect(data.usageCount).toBe(7)
      expect(data.name).toBe('X')
    })
  })

  describe('PATCH', () => {
    it('forbids editing built-in', async () => {
      asAdmin()
      ;(DomainTypeTemplate.findById as jest.Mock).mockResolvedValue(
        buildDoc({ isBuiltIn: true })
      )
      const req = {
        method: 'PATCH',
        query: { id: VALID_ID },
        body: { name: 'Y' },
      } as any
      const res = makeRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('returns 409 when renaming to existing name', async () => {
      asAdmin()
      ;(DomainTypeTemplate.findById as jest.Mock).mockResolvedValue(buildDoc())
      ;(DomainTypeTemplate.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'other', name: 'Y' }),
      })

      const req = {
        method: 'PATCH',
        query: { id: VALID_ID },
        body: { name: 'Y' },
      } as any
      const res = makeRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(409)
    })

    it('updates name and category', async () => {
      asAdmin()
      const doc = buildDoc()
      ;(DomainTypeTemplate.findById as jest.Mock).mockResolvedValue(doc)
      ;(DomainTypeTemplate.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      })

      const req = {
        method: 'PATCH',
        query: { id: VALID_ID },
        body: { name: '  New ', category: 'it' },
      } as any
      const res = makeRes()
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(doc.name).toBe('New')
      expect(doc.category).toBe('it')
      expect(doc.save).toHaveBeenCalled()
    })

    it('rejects invalid category', async () => {
      asAdmin()
      ;(DomainTypeTemplate.findById as jest.Mock).mockResolvedValue(buildDoc())
      const req = {
        method: 'PATCH',
        query: { id: VALID_ID },
        body: { category: 'pirate' },
      } as any
      const res = makeRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('DELETE', () => {
    it('forbids deleting built-in', async () => {
      asAdmin()
      ;(DomainTypeTemplate.findById as jest.Mock).mockResolvedValue(
        buildDoc({ isBuiltIn: true })
      )
      const req = {
        method: 'DELETE',
        query: { id: VALID_ID },
        body: {},
      } as any
      const res = makeRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('returns 409 when in use without force', async () => {
      asAdmin()
      ;(DomainTypeTemplate.findById as jest.Mock).mockResolvedValue(buildDoc())
      ;(Domain.countDocuments as jest.Mock).mockResolvedValue(3)

      const req = {
        method: 'DELETE',
        query: { id: VALID_ID },
        body: {},
      } as any
      const res = makeRes()
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(409)
      const { data } = res.json.mock.calls[0][0]
      expect(data.usageCount).toBe(3)
    })

    it('soft-archives when in use with force=true', async () => {
      asAdmin()
      const doc = buildDoc()
      ;(DomainTypeTemplate.findById as jest.Mock).mockResolvedValue(doc)
      ;(Domain.countDocuments as jest.Mock).mockResolvedValue(3)

      const req = {
        method: 'DELETE',
        query: { id: VALID_ID, force: 'true' },
        body: {},
      } as any
      const res = makeRes()
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(doc.archivedAt).toBeInstanceOf(Date)
      expect(doc.save).toHaveBeenCalled()
      expect(doc.deleteOne).not.toHaveBeenCalled()
    })

    it('hard-deletes when not in use', async () => {
      asAdmin()
      const doc = buildDoc()
      ;(DomainTypeTemplate.findById as jest.Mock).mockResolvedValue(doc)
      ;(Domain.countDocuments as jest.Mock).mockResolvedValue(0)

      const req = {
        method: 'DELETE',
        query: { id: VALID_ID, force: 'true' },
        body: {},
      } as any
      const res = makeRes()
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(doc.deleteOne).toHaveBeenCalled()
      expect(doc.archivedAt).toBeNull()
    })
  })

  describe('other methods', () => {
    it('returns 405 for unsupported method', async () => {
      asAdmin()
      ;(DomainTypeTemplate.findById as jest.Mock).mockResolvedValue(buildDoc())
      const req = { method: 'PUT', query: { id: VALID_ID }, body: {} } as any
      const res = makeRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(405)
    })
  })
})
