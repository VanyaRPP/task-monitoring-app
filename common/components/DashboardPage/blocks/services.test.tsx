import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { render, screen } from '@testing-library/react'
import { AppRoutes, Roles } from '@utils/constants'
import { useRouter } from 'next/router'
import ServicesBlock from './services'

jest.mock('next/router', () => ({ useRouter: jest.fn() }))
jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))
jest.mock('@common/api/serviceApi/service.api', () => ({
  useGetAllServicesQuery: () => ({ data: { data: [] } }),
  useDeleteServiceMutation: () => [jest.fn()],
}))
jest.mock('@common/api/filterApi/filter.api', () => ({
  useGetDomainFiltersQuery: () => ({
    data: { domainsFilter: [{ text: 'Домен', value: 'domain-a' }] },
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
jest.mock('@components/InflationOverridePanel', () => () => null)
jest.mock(
  '@components/ElectricityChart',
  () =>
    function ElectricityChartStub() {
      return <div data-testid="electricity-chart" />
    }
)
jest.mock(
  '@components/TariffsChart',
  () =>
    function TariffsChartStub() {
      return <div data-testid="tariffs-chart" />
    }
)

const renderBlock = (role: Roles, pathname: string = AppRoutes.SERVICE) => {
  jest.mocked(useRouter).mockReturnValue({ pathname } as any)
  jest
    .mocked(useGetCurrentUserQuery)
    .mockReturnValue({ data: { roles: [role] } } as any)

  render(<ServicesBlock />)
}

describe.each([['tariffs-chart'], ['electricity-chart']])(
  'ServicesBlock: %s',
  (chart) => {
    it.each([[Roles.DOMAIN_ADMIN], [Roles.GLOBAL_ADMIN]])(
      'is shown to %s on the services page',
      (role) => {
        renderBlock(role)

        expect(screen.getByTestId(chart)).toBeInTheDocument()
      }
    )

    it('is hidden from a User', () => {
      renderBlock(Roles.USER)

      expect(screen.queryByTestId(chart)).not.toBeInTheDocument()
    })

    it('is not part of the dashboard block', () => {
      renderBlock(Roles.DOMAIN_ADMIN, AppRoutes.INDEX)

      expect(screen.queryByTestId(chart)).not.toBeInTheDocument()
    })
  }
)
