import { usePermissions } from '..'
import { expect } from '@jest/globals'
import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import { calculatePermissions } from '..'

jest.mock('@common/api/userApi/user.api', () => ({
  useGetUserByEmailQuery: jest.fn(),
}))

jest.mock('react', () => {
  const actual = jest.requireActual('react')
  return {
    ...actual,
    useState: jest.fn((initial) => [initial, jest.fn()]),
    useEffect: jest.fn(),
  }
})

jest.mock('..', () => {
  const original = jest.requireActual('..')
  return {
    ...original,
    calculatePermissions: jest.fn(),
  }
})

const mockedUseGetUserByEmailQuery = useGetUserByEmailQuery as jest.Mock
const mockedCalculatePermissions = calculatePermissions as jest.Mock

describe('usePermissions', () => {
  it('returns null while loading', () => {
    mockedUseGetUserByEmailQuery.mockReturnValue({
      data: null,
      isLoading: true,
    })

    const result = usePermissions({ email: "a@a.com" } as any)

    expect(result).toBeNull()
  })

  it('calls calculatePermissions when data loaded', () => {
    const user = {
      email: "user@example.com",
      roles: ['User'],
    }

    mockedUseGetUserByEmailQuery.mockReturnValue({
      data: user,
      isLoading: false,
    })

    mockedCalculatePermissions.mockReturnValue({
      isUser: true,
      isAdmin: false,
    })

    const result = usePermissions(user as any)

    expect(mockedCalculatePermissions).toHaveBeenCalledWith(user, user)
    expect(result).toEqual({
      isUser: true,
      isAdmin: false,
    })
  })

  it('returns null if user not found', () => {
    mockedUseGetUserByEmailQuery.mockReturnValue({
      data: null,
      isLoading: false,
    })

    const result = usePermissions({ email: "a@a.com" } as any)

    expect(result).toBeNull()
  })
})
