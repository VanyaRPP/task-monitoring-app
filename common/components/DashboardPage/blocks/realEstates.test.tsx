import { fireEvent, render, screen } from '@testing-library/react'
import { useRouter } from 'next/router'
import RealEstateBlock from './realEstates'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useAccessibleCustomServices } from '@common/api/customServicesApi/useAccessibleCustomServices'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useGetAllRealEstateQuery: jest.fn(),
}))

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))

jest.mock('@common/api/customServicesApi/useAccessibleCustomServices', () => ({
  useAccessibleCustomServices: jest.fn(),
}))

jest.mock('@utils/helpers', () => ({
  isAdminCheck: jest.fn(() => false),
}))

jest.mock('@components/UI/TableCard', () => {
  const MockTableCard = ({ title, children }: any) => (
    <div>
      {title}
      {children}
    </div>
  )
  MockTableCard.displayName = 'TableCard'
  return MockTableCard
})

jest.mock('@components/Tables/Companies/Header', () => {
  const MockHeader = (props: any) => (
    <div>
      <div data-testid="header-data">{props.realEstates?.tag}</div>
      <button
        onClick={() =>
          props.setFilters((prev: any) => ({ ...prev, services: ['s1'] }))
        }
      >
        pick-service
      </button>
      <button
        onClick={() =>
          props.setFilters((prev: any) => ({ ...prev, services: [] }))
        }
      >
        reset-services
      </button>
    </div>
  )
  MockHeader.displayName = 'CompaniesHeader'
  return MockHeader
})

jest.mock('@components/Tables/Companies/Table', () => {
  const MockTable = (props: any) => (
    <div data-testid="table-data">{props.realEstates?.tag}</div>
  )
  MockTable.displayName = 'CompaniesTable'
  return MockTable
})

describe('RealEstateBlock — фільтр послуг і дані для опцій', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ pathname: '/' })
    ;(useGetCurrentUserQuery as jest.Mock).mockReturnValue({
      data: { roles: [] },
    })
    ;(useAccessibleCustomServices as jest.Mock).mockReturnValue({
      services: [],
    })
    // Бекенд повертає "filtered", коли в запиті є services, інакше "all"
    ;(useGetAllRealEstateQuery as jest.Mock).mockImplementation(
      (args: any) => ({
        data: args?.services?.length
          ? { tag: 'filtered', data: [] }
          : { tag: 'all', data: [] },
        isLoading: false,
        isError: false,
      })
    )
  })

  it('без вибраних послуг і шапка, і таблиця отримують повний список', () => {
    render(<RealEstateBlock />)

    expect(screen.getByTestId('header-data')).toHaveTextContent('all')
    expect(screen.getByTestId('table-data')).toHaveTextContent('all')
  })

  // РЕГРЕСІЙНИЙ ТЕСТ: раніше шапка отримувала відфільтрований список, тому
  // після вибору послуги з випадного списку зникали всі інші опції.
  it('після вибору послуги таблиця фільтрується, а шапка зберігає повний список', () => {
    render(<RealEstateBlock />)

    fireEvent.click(screen.getByText('pick-service'))

    expect(screen.getByTestId('table-data')).toHaveTextContent('filtered')
    expect(screen.getByTestId('header-data')).toHaveTextContent('all')
  })

  it('запит для опцій шапки не містить services', () => {
    render(<RealEstateBlock />)

    fireEvent.click(screen.getByText('pick-service'))

    const calls = (useGetAllRealEstateQuery as jest.Mock).mock.calls
    const lastCalls = calls.slice(-2).map(([args]) => args)
    const withServices = lastCalls.filter((a) => a.services?.length)
    const withoutServices = lastCalls.filter((a) => !a.services)

    expect(withServices).toHaveLength(1)
    expect(withoutServices).toHaveLength(1)
  })

  it('скидання послуг повертає початковий список у таблиці', () => {
    render(<RealEstateBlock />)

    fireEvent.click(screen.getByText('pick-service'))
    expect(screen.getByTestId('table-data')).toHaveTextContent('filtered')

    fireEvent.click(screen.getByText('reset-services'))
    expect(screen.getByTestId('table-data')).toHaveTextContent('all')
    expect(screen.getByTestId('header-data')).toHaveTextContent('all')
  })
})
