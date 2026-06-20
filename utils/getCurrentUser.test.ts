import { expect } from '@jest/globals'
import { getCurrentUser } from '@utils/getCurrentUser'

import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { users, domains } from '@utils/testData'
import { Roles } from '@utils/constants'
import User from '@modules/models/User'
import Domain from '@modules/models/Domain'

jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('getCurrentUser', () => {
  it('Should find and return a plain User (administers nothing)', async () => {
    // user2 is not listed in any Domain/RealEstate adminEmails.
    await mockLoginAs(users.user2)

    const { isDomainAdmin, isGlobalAdmin, isUser } = await getCurrentUser(
      {},
      {}
    )

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

  it('Should derive DomainAdmin from Domain membership (promotion)', async () => {
    // user2 is seeded with role User; add their email to a domain's adminEmails
    // so the role is derived up to DomainAdmin.
    await Domain.updateOne(
      { _id: domains[2]._id },
      { $addToSet: { adminEmails: users.user2.email } }
    )
    await mockLoginAs(users.user2)

    const { isDomainAdmin, user } = await getCurrentUser({}, {})

    expect(isDomainAdmin).toBeTruthy()
    expect(user.roles).toEqual([Roles.DOMAIN_ADMIN])
  })

  it('Should demote a DomainAdmin who administers no domain (demotion)', async () => {
    const orphan = await User.create({
      name: 'orphanAdmin',
      email: 'orphan-admin@example.com',
      roles: [Roles.DOMAIN_ADMIN],
      isWorker: false,
    })
    await mockLoginAs({ email: orphan.email, roles: [Roles.DOMAIN_ADMIN] })

    const { isDomainAdmin, isUser, user } = await getCurrentUser({}, {})

    expect(isDomainAdmin).toBeFalsy()
    expect(isUser).toBeTruthy()
    expect(user.roles).toEqual([Roles.USER])
  })

  it('Should not demote a GlobalAdmin who administers no domain', async () => {
    await mockLoginAs(users.globalAdmin)

    const { isGlobalAdmin, isDomainAdmin, user } = await getCurrentUser({}, {})

    expect(isGlobalAdmin).toBeTruthy()
    expect(isDomainAdmin).toBeFalsy()
    expect(user.roles).toEqual([Roles.GLOBAL_ADMIN])
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
