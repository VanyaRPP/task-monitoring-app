import { calculatePermissions } from '..'
import { Roles } from '@utils/constants'

const users = {
  user: {
    name: 'user',
    email: 'user@example.com',
    roles: [Roles.USER],
    isWorker: true,
  },
  domainAdmin: {
    name: 'domainAdmin',
    email: 'domainAdmin@example.com',
    roles: [Roles.DOMAIN_ADMIN],
    isWorker: true,
  },
  globalAdmin: {
    name: 'globalAdmin',
    email: 'globalAdmin@example.com',
    roles: [Roles.GLOBAL_ADMIN],
    isWorker: true,
  },
  noRoleUser: {
    name: 'noRoleUser',
    email: 'noRoleUser@example.com',
    roles: [],
    isWorker: false,
  },
}

describe('calculatePermissions (pure logic)', () => {
  it('user with role User', () => {
    const result = calculatePermissions(users.user as any, users.user as any)

    expect(result).toEqual({
      isGlobalAdmin: false,
      isDomainAdmin: false,
      isUser: true,
      isAdmin: false,
    })
  })

  it('user with role DomainAdmin', () => {
    const result = calculatePermissions(
      users.domainAdmin as any,
      users.domainAdmin as any
    )

    expect(result).toEqual({
      isGlobalAdmin: false,
      isDomainAdmin: true,
      isUser: true,
      isAdmin: true,
    })
  })

  it('user with role GlobalAdmin', () => {
    const result = calculatePermissions(
      users.globalAdmin as any,
      users.globalAdmin as any
    )

    expect(result).toEqual({
      isGlobalAdmin: true,
      isDomainAdmin: false,
      isUser: true,
      isAdmin: true,
    })
  })

  it('user not found', () => {
    const result = calculatePermissions(null, users.noRoleUser as any)

    expect(result).toEqual({
      isGlobalAdmin: false,
      isDomainAdmin: false,
      isUser: false,
      isAdmin: false,
    })
  })
})
