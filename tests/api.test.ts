import { mocked } from 'ts-jest/utils'
import { NextApiRequest, NextApiResponse } from 'next'
import Domain from 'common/modules/models/Domain'
import handler from '../your-handler-file' // Замініть на ваш файл обробника запитів
import { getCurrentUser } from '@utils/getCurrentUser'

// Мокуємо функцію getCurrentUser з utils/getCurrentUser
jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn()
}))

// Мокуємо модуль Domain
jest.mock('common/modules/models/Domain', () => ({
  find: jest.fn(),
  create: jest.fn()
}))

describe('API Handler', () => {
  let req: NextApiRequest
  let res: NextApiResponse

  beforeEach(() => {
    req = {
      method: '',
      body: {},
    } as unknown as NextApiRequest

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as NextApiResponse
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET request', () => {
    beforeEach(() => {
      req.method = 'GET'
      mocked(Domain.find).mockReset()
    })

    test('should return domains', async () => {
      // Мокуємо поведінку функції getCurrentUser
      mocked(getCurrentUser).mockResolvedValueOnce({ isGlobalAdmin: true })

      // Підготовка даних
      const domains = [
        {
          _id: '1',
          name: 'Domain 1',
        },
        {
          _id: '2',
          name: 'Domain 2',
        },
      ]

      // Мокуємо функцію find з модуля Domain
      mocked(Domain.find).mockResolvedValueOnce(domains)

      // Виклик обробника
      await handler(req, res)

      // Перевірка, що статус і json були викликані з правильними аргументами
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: domains,
      })
    })

    test('should return error if not admin', async () => {
      // Мокуємо поведінку функції getCurrentUser
      mocked(getCurrentUser).mockResolvedValueOnce({ isGlobalAdmin: false })

      // Виклик обробника
      await handler(req, res)

      // Перевірка, що статус і json були викликані з правильними аргументами
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'not allowed',
      })
    })

    test('should return error if find throws an error', async () => {
      // Мокуємо поведінку функції getCurrentUser
      mocked(getCurrentUser).mockResolvedValueOnce({ isGlobalAdmin: true })

      // Мокуємо функцію find з модуля Domain, щоб кинути помилку
      const error = new Error('Database error')
      mocked(Domain.find).mockRejectedValueOnce(error)