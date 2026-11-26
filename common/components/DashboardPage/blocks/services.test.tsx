import { useGetDomainsByAdminQuery } from '@common/api/domainApi/domain.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { render, screen } from '@testing-library/react'
import { AppRoutes, Roles } from '@utils/constants'
import { useRouter } from 'next/router'
import ServicesBlock from './services'

jest.mock('next/router', () => ({ useRouter: jest.fn() }))
jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))
jest.mock('@common/api/domainApi/domain.api', () => ({
  useGetDomainsByAdminQuery: jest.fn(),
}))
jest.mock('@common/api/serviceApi/service.api', () => ({
  useGetAllServicesQuery: () => ({ data: { data: [] } }),
  useDeleteServiceMutation: () => [jest.fn()],
}))
// The table filter also offers a domain the user only represents a company in.
jest.mock('@common/api/filterApi/filter.api', () => ({
  useGetDomainFiltersQuery: () => ({
    data: {
      domainsFilter: [
        { text: 'Свій домен', value: 'own' },
        { text: 'Чужий домен', value: 'foreign' },
      ],
    },
  }),
  useGetAddressFiltersQuery: () => ({}),
  useGetDateFiltersQuery: () => ({}),
}))
jest.mock('@common/api/customServicesApi/useAccessibleCustomServices', () => ({
  useAccessibleCustomServices: () => ({ services: [] }),
}))
jest.mock('@components/Tables/Services/Header', () => () => null)
jest.mock('@components/Tables/Services/Table', () => () => null)
jest.mock('@components/UI/ModalDelete', () => () => null)
jest.mock(
  '@components/InflationOverridePanel',
  () =>
    function InflationStub() {
      return <div data-testid="inflation-chart" />
    }
)

type ChartProps = { domains: { value: string }[] }

jest.mock(
  '@components/ElectricityChart',
  () =>
    function ElectricityChartStub({ domains }: ChartProps) {
      return (
        <div data-testid="electricity-chart">
          {domains.map(({ value }) => value).join()}
        </div>
      )
    }
)
jest.mock(
  '@components/TariffsChart',
  () =>
    function TariffsChartStub({ domains }: ChartProps) {
      return (
        <div data-testid="tariffs-chart">
          {domains.map(({ value }) => value).join()}
        </div>
      )
    }
)

const adminList = jest.mocked(useGetDomainsByAdminQuery)

const renderBlock = (
  role: Roles,
  {
    pathname = AppRoutes.SERVICE as string,
    adminDomains = [{ _id: 'own', name: 'Свій домен' }],
  } = {}
) => {
  jest.mocked(useRouter).mockReturnValue({ pathname } as any)
  jest
    .mocked(useGetCurrentUserQuery)
    .mockReturnValue({ data: { roles: [role] } } as any)
  // as RTK Query does: a skipped query has no data
  adminList.mockImplementation(
    (_, options: any) =>
      ({ data: options?.skip ? undefined : adminDomains }) as any
  )

  render(<ServicesBlock />)
}

const charts = ['tariffs-chart', 'electricity-chart']

describe('ServicesBlock: charts by role', () => {
  beforeEach(() => adminList.mockReset())

  it.each([[Roles.DOMAIN_ADMIN], [Roles.GLOBAL_ADMIN]])(
    'shows %s every chart',
    (role) => {
      renderBlock(role)

      for (const chart of [...charts, 'inflation-chart']) {
        expect(screen.getByTestId(chart)).toBeInTheDocument()
      }
    }
  )

  it('offers in the charts only the domains the user administers', () => {
    renderBlock(Roles.DOMAIN_ADMIN)

    for (const chart of charts) {
      expect(screen.getByTestId(chart)).toHaveTextContent(/^own$/)
    }
  })

  it('shows a User nothing but the inflation index', () => {
    renderBlock(Roles.USER)

    expect(screen.getByTestId('inflation-chart')).toBeInTheDocument()
    for (const chart of charts) {
      expect(screen.queryByTestId(chart)).not.toBeInTheDocument()
    }
    expect(adminList).toHaveBeenLastCalledWith(expect.anything(), {
      skip: true,
    })
  })

  it('keeps the inflation index when there is no domain to chart', () => {
    renderBlock(Roles.DOMAIN_ADMIN, { adminDomains: [] })

    expect(screen.getByTestId('inflation-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('tariffs-chart')).not.toBeInTheDocument()
  })

  it('adds no charts to the dashboard block', () => {
    renderBlock(Roles.GLOBAL_ADMIN, { pathname: AppRoutes.INDEX })

    for (const chart of [...charts, 'inflation-chart']) {
      expect(screen.queryByTestId(chart)).not.toBeInTheDocument()
    }
  })
})
