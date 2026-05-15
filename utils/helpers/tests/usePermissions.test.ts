import { usePermissions, calculatePermissions } from '..'
import { expect } from '@jest/globals'
import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import { users } from '@utils/testData'

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

    const dummyUser = {
      name: 'dummy',
      email: 'a@a.com',
      roles: [],
      isWorker: true,
    }

    const result = usePermissions(dummyUser as any)

    expect(result).toBeNull()
  })

  it('calls calculatePermissions when data loaded', () => {
    const passedUser = users.user
    const apiUser = users.user

    mockedCalculatePermissions.mockReturnValue({
      isUser: true,
      isAdmin: false,
    })

    const result = calculatePermissions(passedUser, apiUser)

    expect(mockedCalculatePermissions).toHaveBeenCalledWith(passedUser, apiUser)
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

    const dummyUser = {
      name: 'dummy',
      email: 'b@b.com',
      roles: [],
      isWorker: true,
    }

    const result = usePermissions(dummyUser as any)

    expect(result).toBeNull()
  })
})
