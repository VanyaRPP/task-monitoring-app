import { Roles } from './constants'

export const testUsersData = [
  {
    name: 'user',
    email: 'user@example.com',
    roles: [Roles.USER],
  },
  {
    name: 'globalAdmin',
    email: 'globalAdmin@example.com',
    roles: [Roles.GLOBAL_ADMIN],
  },
  {
    name: 'domainAdmin',
    email: 'domainAdmin@example.com',
    roles: [Roles.DOMAIN_ADMIN],
  },
]
