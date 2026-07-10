import handlerImport from '@pages/api/custom-services'
import { getCurrentUser as getCurrentUserFn } from '@utils/getCurrentUser'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'

jest.mock('@pages/api/api.config', () => jest.fn())

jest.mock('@modules/models/CustomService', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  },
}))

jest.mock('@modules/models/Domain', () => ({
  __esModule: true,
  default: {
    exists: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn(),
    insertMany: jest.fn().mockResolvedValue([]),
    deleteMany: jest.fn().mockResolvedValue({}),
  },
}))

jest.mock('@modules/models/RealEstate', () => ({
  __esModule: true,
  default: {
    updateMany: jest.fn(),
    insertMany: jest.fn().mockResolvedValue([]),
    deleteMany: jest.fn().mockResolvedValue({}),
  },
}))

import CustomServiceModel from '@modules/models/CustomService'
import DomainModel from '@modules/models/Domain'
import RealEstateModel from '@modules/models/RealEstate'

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

// These modules are jest-mocked above; re-type them as loose jest mocks so
// .mockResolvedValue / .mockReturnValue are available without fighting the real
// mongoose model types. Behaviour is unchanged — only the static types differ.
const CustomService = CustomServiceModel as unknown as Record<string, jest.Mock>
const Domain = DomainModel as unknown as Record<string, jest.Mock>
const RealEstate = RealEstateModel as unknown as Record<string, jest.Mock>
const getCurrentUser = getCurrentUserFn as unknown as jest.Mock
// req/res are partial mocks in tests, so accept anything here.
const handler = handlerImport as (req: any, res: any) => Promise<unknown>

setupTestEnvironment()

const DOMAIN_ID = '64d68421d9ba2fc8fea79d11'
const SERVICE_ID = '64d68421d9ba2fc8fea79d99'

const mockCreatedService = {
  _id: SERVICE_ID,
  name: 'Прибирання',
  fieldName: 'prybyrannia',
  domain: DOMAIN_ID,
  toObject: jest.fn().mockReturnValue({
    _id: SERVICE_ID,
    name: 'Прибирання',
    fieldName: 'prybyrannia',
    domain: DOMAIN_ID,
  }),
}

const mockDomain = {
  _id: DOMAIN_ID,
  customServices: [{ groupName: 'Стандартні послуги', services: [] }],
}

describe('saveAdHocService — збереження власної послуги в домен', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // за замовчуванням домен існує і доступний
    Domain.exists.mockResolvedValue({ _id: DOMAIN_ID })
    Domain.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockDomain),
    })
    Domain.updateOne.mockResolvedValue({ matchedCount: 1 })
    RealEstate.updateMany.mockResolvedValue({})
    CustomService.findOne.mockResolvedValue(null) // немає дублікату
  })

  // ─── Успішне створення ────────────────────────────────────────────────────

  describe('Успішне створення послуги', () => {
    it('GlobalAdmin може зберегти власну послугу в домен', async () => {
      getCurrentUser.mockResolvedValueOnce({
        isGlobalAdmin: true,
        isDomainAdmin: false,
        isUser: false,
        user: { email: 'admin@test.com' },
      })

      CustomService.create.mockResolvedValueOnce(mockCreatedService)

      const mockReq = {
        method: 'POST',
        query: {},
        body: { name: 'Прибирання', domainId: DOMAIN_ID },
      }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      )
      expect(CustomService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Прибирання',
          domain: expect.anything(),
        })
      )
    })

    it('DomainAdmin може зберегти власну послугу в свій домен', async () => {
      getCurrentUser.mockResolvedValueOnce({
        isGlobalAdmin: false,
        isDomainAdmin: true,
        isUser: false,
        user: { email: 'domainadmin@test.com' },
      })

      CustomService.create.mockResolvedValueOnce(mockCreatedService)

      const mockReq = {
        method: 'POST',
        query: {},
        body: { name: 'Прибирання', domainId: DOMAIN_ID },
      }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(CustomService.create).toHaveBeenCalled()
    })

    it('після створення послуга додається в першу існуючу групу домену', async () => {
      getCurrentUser.mockResolvedValueOnce({
        isGlobalAdmin: true,
        isDomainAdmin: false,
        isUser: false,
        user: { email: 'admin@test.com' },
      })

      CustomService.create.mockResolvedValueOnce(mockCreatedService)

      const mockReq = {
        method: 'POST',
        query: {},
        body: { name: 'Прибирання', domainId: DOMAIN_ID },
      }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      await handler(mockReq, mockRes)

      // перевіряємо що updateOne викликався для існуючої групи
      expect(Domain.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({ _id: expect.anything() }),
        expect.objectContaining({ $addToSet: expect.anything() }),
        expect.anything()
      )
    })
  })

  // ─── Валідація дублікатів ─────────────────────────────────────────────────

  describe('Валідація — послуга з такою назвою вже існує', () => {
    it('повертає 409 якщо послуга з такою назвою вже є в домені', async () => {
      getCurrentUser.mockResolvedValueOnce({
        isGlobalAdmin: true,
        isDomainAdmin: false,
        isUser: false,
        user: { email: 'admin@test.com' },
      })

      // симулюємо що послуга вже існує
      CustomService.findOne.mockResolvedValueOnce(mockCreatedService)

      const mockReq = {
        method: 'POST',
        query: {},
        body: { name: 'Прибирання', domainId: DOMAIN_ID },
      }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Послуга з такою назвою вже існує',
        })
      )
      expect(CustomService.create).not.toHaveBeenCalled()
    })

    it('не створює якщо назва відрізняється тільки регістром', async () => {
      getCurrentUser.mockResolvedValueOnce({
        isGlobalAdmin: true,
        isDomainAdmin: false,
        isUser: false,
        user: { email: 'admin@test.com' },
      })

      CustomService.findOne.mockResolvedValueOnce(mockCreatedService)

      const mockReq = {
        method: 'POST',
        query: {},
        body: { name: 'ПРИБИРАННЯ', domainId: DOMAIN_ID },
      }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(CustomService.create).not.toHaveBeenCalled()
    })
  })

  // ─── Валідація назви ──────────────────────────────────────────────────────

  describe('Валідація — порожня назва', () => {
    const invalidNames = [
      { name: null, desc: 'null' },
      { name: undefined, desc: 'undefined' },
      { name: '', desc: 'порожній рядок' },
      { name: '   ', desc: 'пробіли' },
    ]

    invalidNames.forEach(({ name, desc }) => {
      it(`повертає 400 якщо назва = ${desc}`, async () => {
        getCurrentUser.mockResolvedValueOnce({
          isGlobalAdmin: true,
          isDomainAdmin: false,
          isUser: false,
          user: { email: 'admin@test.com' },
        })

        const mockReq = {
          method: 'POST',
          query: {},
          body: { name, domainId: DOMAIN_ID },
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        }

        await handler(mockReq, mockRes)

        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(CustomService.create).not.toHaveBeenCalled()
      })
    })
  })

  // ─── Доступ ───────────────────────────────────────────────────────────────

  describe('Контроль доступу', () => {
    it('User не може зберегти послугу в домен', async () => {
      getCurrentUser.mockResolvedValueOnce({
        isGlobalAdmin: false,
        isDomainAdmin: false,
        isUser: true,
        user: { email: 'user@test.com' },
      })

      const mockReq = {
        method: 'POST',
        query: {},
        body: { name: 'Прибирання', domainId: DOMAIN_ID },
      }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Не дозволено' })
      )
      expect(CustomService.create).not.toHaveBeenCalled()
    })
  })
})
