import { ProfilePage } from '@components/Pages/Profile'
import { useGetDomainFiltersQuery } from '@common/api/filterApi/filter.api'
import { useGetMyCompaniesQuery } from '@common/api/realestateApi/realestate.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { Roles } from '@utils/constants'
import { render, screen } from '@testing-library/react'

jest.mock('@common/api/filterApi/filter.api', () => ({
  useGetDomainFiltersQuery: jest.fn(),
}))
jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useGetMyCompaniesQuery: jest.fn(),
}))
jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))
jest.mock('@common/components/FeatureFlagsTable', () => ({
  FeatureFlagsTable: () => null,
}))
jest.mock('@components/Tables/UsersTable', () => ({ UsersTable: () => null }))
jest.mock('@common/components/Pages/Profile/Modal/AddFeatureFlagModal', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@components/Forms/EditUserForm', () => ({
  EditUserForm: () => null,
}))
jest.mock('next/image', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn() }) }))
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { name: 'user', email: 'user@example.com', image: '' } },
  })),
}))

const mockedMyCompanies = useGetMyCompaniesQuery as unknown as jest.Mock
const mockedDomains = useGetDomainFiltersQuery as unknown as jest.Mock
const mockedUser = useGetCurrentUserQuery as unknown as jest.Mock

describe('Profile page - companies list', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedDomains.mockReturnValue({ data: { domainsFilter: [] } })
    mockedUser.mockReturnValue({ data: { name: 'user', roles: [Roles.USER] } })
  })

  it('shows the single company of a user who administers one', () => {
    mockedMyCompanies.mockReturnValue({
      data: { success: true, data: [{ _id: '1', companyName: 'my_only' }] },
    })

    render(<ProfilePage />)

    expect(screen.getByText('my_only')).toBeInTheDocument()
  })

  it('shows every company of a user who administers several', () => {
    mockedMyCompanies.mockReturnValue({
      data: {
        success: true,
        data: [
          { _id: '1', companyName: 'my_first' },
          { _id: '2', companyName: 'my_second' },
        ],
      },
    })

    render(<ProfilePage />)

    expect(screen.getByText('my_first')).toBeInTheDocument()
    expect(screen.getByText('my_second')).toBeInTheDocument()
  })

  it('shows nothing when the user administers no company', () => {
    mockedMyCompanies.mockReturnValue({ data: { success: true, data: [] } })

    render(<ProfilePage />)

    expect(screen.getByText('Компанії')).toBeInTheDocument()
    expect(screen.queryByText('my_only')).not.toBeInTheDocument()
  })
})
