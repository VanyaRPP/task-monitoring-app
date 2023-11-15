import { expect } from '@jest/globals'
import { getCurrentUser } from '@utils/getCurrentUser'

import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { users } from '@utils/testData'

jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('getCurrentUser', () => {
  it('Should Find and return User ', async () => {
    await mockLoginAs(users.user)

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
    await mockLoginAs(users.globalAdmin)

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
    await mockLoginAs(users.domainAdmin)

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
    await mockLoginAs({ email: 'not_exist@example.com', roles: [] })

    try {
      await getCurrentUser({}, {})
    } catch (error) {
      expect(error.message).toBe('no user found')
    }
  })
})
