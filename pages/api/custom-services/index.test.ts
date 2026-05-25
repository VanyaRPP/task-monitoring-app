import { expect } from '@jest/globals'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import handler from '@pages/api/custom-services/index'
import CustomService from '@modules/models/CustomService'
import { users } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('@modules/models/CustomService')

setupTestEnvironment()

describe('CustomServices API', () => {
  const createMocks = (method: string, { body = {}, query = {} } = {}) => {
    const req = { method, body, query } as any
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any
    return { req, res }
  }

  describe('POST /api/custom-services (Validation & Safety)', () => {
    test.each([
      ['undefined', {}],
      ['null', { name: null }],
      ['empty string', { name: '' }],
      ['just spaces', { name: '   ' }],
    ])('should return 400 if name is %s', async (_, body) => {
      await mockLoginAs(users.globalAdmin)
      const { req, res } = createMocks('POST', { body })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Назва послуги не може бути порожньою',
        })
      )
    })

    it('should escape regex characters to prevent ReDoS or bypass', async () => {
      await mockLoginAs(users.globalAdmin)
      const spicyName = 'Service.*'
      const { req, res } = createMocks('POST', { body: { name: spicyName } })

      ;(CustomService.findOne as jest.Mock).mockResolvedValue(null)
      ;(CustomService.create as jest.Mock).mockResolvedValue({
        name: spicyName,
        toObject: () => ({ name: spicyName }),
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(CustomService.findOne).toHaveBeenCalledWith({
        name: { $regex: '^Service\\.\\*$', $options: 'i' },
        $or: [{ domain: null }, { domain: { $exists: false } }],
      })
    })
  })

  describe('DELETE /api/custom-services (Access Control)', () => {
    it('should return 400 when admin omits domainId', async () => {
      await mockLoginAs(users.domainAdmin)
      const { req, res } = createMocks('DELETE', { query: { id: 'some-id' } })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      )
    })

    it('should return 400 for malformed or missing IDs', async () => {
      await mockLoginAs(users.globalAdmin)
      const { req, res } = createMocks('DELETE', {
        query: { id: ['', 'array'] } as any,
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('GET /api/custom-services (Data Retrieval)', () => {
    it('should return 400 for regular Users (No access allowed)', async () => {
      await mockLoginAs(users.user)
      const { req, res } = createMocks('GET')

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Не дозволено' })
      )
    })

    it('should handle multi-ID filtering via query string', async () => {
      await mockLoginAs(users.domainAdmin)
      const ids = '64d68421d9ba2fc8fea79d14,64d68421d9ba2fc8fea79d15'
      const { req, res } = createMocks('GET', { query: { _id: ids } })

      const mockFindChain = {
        lean: jest
          .fn()
          .mockResolvedValue([{ name: 'Service 1' }, { name: 'Service 2' }]),
      }
      ;(CustomService.find as jest.Mock).mockReturnValue(mockFindChain)

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)

      expect(CustomService.find).toHaveBeenCalledWith({
        _id: { $in: ['64d68421d9ba2fc8fea79d14', '64d68421d9ba2fc8fea79d15'] },
      })
    })
  })
})
