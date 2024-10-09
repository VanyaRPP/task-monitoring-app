import { expect } from '@jest/globals'
import { isDomainAdmin } from '..'
import RealEstate from '@modules/models/RealEstate'
import { IUser } from '@modules/models/User'

describe('isDomainAdmin', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('Повинен повернути false, якщо користувач не визначений', async () => {
    const result = await isDomainAdmin(undefined)
    expect(result).toBe(false)
  })

  it('Повинен повернути false, якщо у користувача немає email', async () => {
    const mockUser: IUser = {
      email: undefined,
      name: 'Test User',
      isWorker: false,
    }

    const result = await isDomainAdmin(mockUser)
    expect(result).toBe(false)
  })

  it('Повинен повернути false, якщо користувач не є адміністратором домену', async () => {
    const findOneSpy = jest.spyOn(RealEstate, 'findOne').mockResolvedValue(null)

    const mockUser: IUser = {
      email: 'nonexistent@example.com',
      name: 'Test User',
      isWorker: false,
    }

    const result = await isDomainAdmin(mockUser)
    expect(result).toBe(false)

    findOneSpy.mockRestore()
  })

  it('Повинен повернути true, якщо email користувача є adminEmails', async () => {
    const mockDomain = new RealEstate({
      IEName: 'Test IEName',
      rnokpp: 'Test rnokpp',
      iban: 'Test iban',
      mfo: 'Test mfo',
      adminEmails: ['admin@example.com'],
      // Додайте інші обов'язкові поля
    })

    const findOneSpy = jest
      .spyOn(RealEstate, 'findOne')
      .mockResolvedValue(mockDomain)

    const mockUser: IUser = {
      email: 'admin@example.com',
      name: 'Admin User',
      isWorker: true,
    }

    const result = await isDomainAdmin(mockUser)
    expect(result).toBe(true)

    findOneSpy.mockRestore()
  })

  it('Повинен повернути false при виникненні помилки бази даних', async () => {
    const findOneSpy = jest
      .spyOn(RealEstate, 'findOne')
      .mockRejectedValue(new Error('Database error'))
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

    const mockUser: IUser = {
      email: 'admin@example.com',
      name: 'Admin User',
      isWorker: true,
    }

    const result = await isDomainAdmin(mockUser)
    expect(consoleSpy).toHaveBeenCalledWith(new Error('Database error'))
    expect(result).toBe(false)

    findOneSpy.mockRestore()
    consoleSpy.mockRestore()
  })
})
