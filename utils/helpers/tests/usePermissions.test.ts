import { usePermissions } from '..'
import { expect } from '@jest/globals'
import { Roles } from '@utils/constants'
import { renderHook } from '@testing-library/react'
import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'

import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

jest.mock('@common/api/userApi/user.api', () => ({
  useGetUserByEmailQuery: jest.fn(),
}))

const mockedUseGetUserByEmailQuery = useGetUserByEmailQuery as jest.Mock

const users = {
  user: {
    name: 'user',
    email: 'user@example.com',
    roles: [Roles.USER],
    isWorker: true,
  },
  user2: {
    name: 'user',
    email: 'user@example2.com',
    roles: [Roles.USER],
    isWorker: true,
  },
  noRoleUser: {
    name: 'noRoleUser',
    email: 'noRoleUser@example.com',
    roles: [],
    isWorker: true,
  },
  domainAdmin: {
    name: 'domainAdmin',
    email: 'domainAdmin@example.com',
    roles: [Roles.DOMAIN_ADMIN],
    isWorker: true,
  },
  domainAdmin2: {
    name: 'domainAdmin2',
    email: 'domainAdmin2@example.com',
    roles: [Roles.DOMAIN_ADMIN],
    isWorker: true,
  },
  globalAdmin: {
    name: 'globalAdmin',
    email: 'globalAdmin@example.com',
    roles: [Roles.GLOBAL_ADMIN],
    isWorker: true,
  },
}

describe('usePermissions', () => {
  it('user with role User', () => {
    mockedUseGetUserByEmailQuery.mockReturnValue({
      data: users.user,
      isLoading: false,
    })

    const { result } = renderHook(() => usePermissions(users.user))

    expect(result.current).toEqual({
      isGlobalAdmin: false,
      isDomainAdmin: false,
      isUser: true,
      isAdmin: false,
    })
  })

  it('user with role DomainAdmin', () => {
    mockedUseGetUserByEmailQuery.mockReturnValue({
      data: users.domainAdmin,
      isLoading: false,
    })

    const { result } = renderHook(() => usePermissions(users.domainAdmin))

    expect(result.current).toEqual({
      isGlobalAdmin: false,
      isDomainAdmin: true,
      isUser: true,
      isAdmin: true,
    })
  })

  it('user with role GlobalAdmin', () => {
    mockedUseGetUserByEmailQuery.mockReturnValue({
      data: users.globalAdmin,
      isLoading: false,
    })

    const { result } = renderHook(() => usePermissions(users.globalAdmin))

    expect(result.current).toEqual({
      isGlobalAdmin: true,
      isDomainAdmin: false,
      isUser: true,
      isAdmin: true,
    })
  })

  it('user not found', () => {
    mockedUseGetUserByEmailQuery.mockReturnValue({
      data: null,
      isLoading: false,
    })

    const { result } = renderHook(() => usePermissions(users.noRoleUser))

    expect(result.current).toEqual({
      isGlobalAdmin: false,
      isDomainAdmin: false,
      isUser: false,
      isAdmin: false,
    })
  })

  it('повертає null, коли дані ще завантажуються', () => {
    mockedUseGetUserByEmailQuery.mockReturnValue({
      data: null,
      isLoading: true,
    })

    const { result } = renderHook(() => usePermissions(users.user))

    expect(result.current).toBeNull()
  })
})
