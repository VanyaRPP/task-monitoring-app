import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import User from '@common/modules/models/User'
import { getServerSession } from 'next-auth'
import { testUsersData } from '@utils/testData'
import { getCurrentUser } from '@utils/getCurrentUser'

jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/api.config', () => jest.fn())

const { expect } = require('@jest/globals')

setupTestEnvironment()

describe('getCurrentUser', () => {
  it('Should Find and return User ', async () => {
    await User.insertMany(testUsersData)
    ;(getServerSession as any).mockResolvedValueOnce({
      user: { email: 'user@example.com' },
    })

    const { isDomainAdmin, isGlobalAdmin, isUser, user } = await getCurrentUser(
      {},
      {}
    )

    expect(user.name).toBe('user')
    expect(isUser).toBeTruthy()
    expect(isDomainAdmin).toBeFalsy()
    expect(isGlobalAdmin).toBeFalsy()
  })

  it('Should Find and return GobalAdmin', async () => {
    await User.insertMany(testUsersData)
    ;(getServerSession as any).mockResolvedValueOnce({
      user: { email: 'globalAdmin@example.com' },
    })

    const { isDomainAdmin, isGlobalAdmin, isUser, user } = await getCurrentUser(
      {},
      {}
    )

    expect(user.name).toBe('globalAdmin')
    expect(isGlobalAdmin).toBeTruthy()
    expect(isDomainAdmin).toBeFalsy()
    expect(isUser).toBeFalsy()
  })

  it('Should Find and return DomainAdmin', async () => {
    await User.insertMany(testUsersData)
    ;(getServerSession as any).mockResolvedValueOnce({
      user: { email: 'domainAdmin@example.com' },
    })

    const { isDomainAdmin, isGlobalAdmin, isUser, user } = await getCurrentUser(
      {},
      {}
    )

    expect(user.name).toBe('domainAdmin')
    expect(isDomainAdmin).toBeTruthy()
    expect(isGlobalAdmin).toBeFalsy()
    expect(isUser).toBeFalsy()
  })

  it('Should throw Error, if user not exists', async () => {
    await User.insertMany(testUsersData)
    ;(getServerSession as any).mockResolvedValueOnce({
      user: { email: 'emailNotExists@example.com' },
    })
    try {
      await getCurrentUser({}, {})
    } catch (error) {
      expect(error.message).toBe('no user found')
    }
  })
})
