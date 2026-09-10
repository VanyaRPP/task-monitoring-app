import { Profile } from '@components/UI/Profile'
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
jest.mock('@components/UI/RolesSelector', () => ({
  RolesSelector: () => null,
}))
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { name: 'user', email: 'user@example.com', image: '' } },
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

const mockedMyCompanies = useGetMyCompaniesQuery as unknown as jest.Mock
const mockedDomains = useGetDomainFiltersQuery as unknown as jest.Mock
const mockedUser = useGetCurrentUserQuery as unknown as jest.Mock

describe('Profile popover - companies list', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedDomains.mockReturnValue({ data: { domainsFilter: [] } })
    mockedUser.mockReturnValue({ data: { roles: [Roles.USER] } })
  })

  it('renders only the companies returned for the current user', () => {
    mockedMyCompanies.mockReturnValue({
      data: {
        success: true,
        data: [
          { _id: '1', companyName: 'my_company_a' },
          { _id: '2', companyName: 'my_company_b' },
        ],
      },
    })

    render(<Profile />)

    expect(screen.getByText('my_company_a')).toBeInTheDocument()
    expect(screen.getByText('my_company_b')).toBeInTheDocument()
    // a company of another user is never fetched, so it can never be rendered
    expect(screen.queryByText('foreign_company')).not.toBeInTheDocument()
  })

  it('asks the profile-scoped endpoint, not the shared company filter', () => {
    mockedMyCompanies.mockReturnValue({ data: { success: true, data: [] } })

    render(<Profile />)

    expect(mockedMyCompanies).toHaveBeenCalled()
  })

  it('renders no company tags when the user administers none', () => {
    mockedMyCompanies.mockReturnValue({ data: { success: true, data: [] } })

    render(<Profile />)

    expect(screen.getByText('Компанії:')).toBeInTheDocument()
    expect(screen.queryByText('my_company_a')).not.toBeInTheDocument()
  })

  it('survives a pending request without crashing', () => {
    mockedMyCompanies.mockReturnValue({ data: undefined })

    expect(() => render(<Profile />)).not.toThrow()
  })
})
