import { NextApiRequest, NextApiResponse } from 'next'
import Domain from 'common/modules/models/Domain'
import { getCurrentUser } from '@utils/getCurrentUser'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin }      
      
      Виклик обробника
      await handler(req, res)

      // Перевірка, що статус і json були викликані з правильними аргументами
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error,
      })
    })
  })

  describe('POST request', () => {
    beforeEach(() => {
      req.method = 'POST'
      mocked(Domain.create).mockReset()
    })

    test('should create domain', async () => {
      // Мокуємо поведінку функції getCurrentUser
      mocked(getCurrentUser).mockResolvedValueOnce({ isGlobalAdmin: true })

      // Мокуємо функцію create з модуля Domain
      const createdDomain = {
        _id: '1',
        name: 'New Domain',
      }
      mocked(Domain.create).mockResolvedValueOnce(createdDomain)

      // Виклик обробника
      req.body = { name: 'New Domain' }
      await handler(req, res)

      // Перевірка, що статус і json були викликані з правильними аргументами
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: createdDomain,
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

    test('should return error if create throws an error', async () => {
      // Мокуємо поведінку функції getCurrentUser
      mocked(getCurrentUser).mockResolvedValueOnce({ isGlobalAdmin: true })

      // Мокуємо функцію create з модуля Domain, щоб кинути помилку
      const error = new Error('Database error')
      mocked(Domain.create).mockRejectedValueOnce(error)

      // Виклик обробника
      req.body = { name: 'New Domain' }
      await handler(req, res)

      // Перевірка, що статус і json були викликані з правильними аргументами
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error,
      })
    })
  })
})
