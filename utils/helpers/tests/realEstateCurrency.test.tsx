import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import RealEstateBlock from '@common/components/DashboardPage/blocks/realEstates'
import { renderCurrency, renderPrice } from '@utils/helpers'

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useGetAllRealEstateQuery: jest.fn(),
  useAddRealEstateMutation: () => [jest.fn()],
  useEditRealEstateMutation: () => [jest.fn()],
  useDeleteRealEstateMutation: () => [jest.fn(), { isLoading: false }],
  useUpdateArchivedItemMutation: () => [jest.fn(), { isLoading: false }],
}))

jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesQuery: jest.fn(),
  useGetCustomServicesByDomainQuery: jest.fn(),
}))

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))

jest.mock('@common/api/filterApi/filter.api', () => ({
  useGetRealEstateFiltersQuery: () => ({ data: undefined }),
  useGetDomainFiltersQuery: () => ({ data: undefined }),
  useGetAddressFiltersQuery: () => ({ data: undefined }),
}))

jest.mock('@common/api/debtorsApi/debtors.api', () => ({
  useGetDebtorsQuery: () => ({ data: undefined, error: undefined }),
}))

jest.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/real-estate' }),
}))

import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useGetCustomServicesQuery } from '@common/api/customServicesApi/customServices.api'

const mockRealEstates = [
  {
    _id: '1',
    companyName: 'Компанія А',
    totalArea: 100,
    pricePerMeter: 2000,
    servicePricePerMeter: 50,
    cleaning: 300,
    discount: 0,
    currency: 'UAH',
    services: [],
    customServices: [],
    adminEmails: ['admin1@example.com'],
    description: 'Будівля А',
    domain: { _id: 'domain-1', name: 'Домен 1' },
    street: { _id: 'street-1', address: 'вул. Тестова, 1', city: 'Київ' },
  },
  {
    _id: '2',
    companyName: 'Компанія Б',
    totalArea: 50,
    pricePerMeter: 1500,
    servicePricePerMeter: 30,
    cleaning: 0,
    discount: -10,
    currency: 'USD',
    services: [],
    customServices: [{ _id: 'cs-1', price: 800, fieldName: 'customField' }],
    adminEmails: ['admin2@example.com'],
    description: 'Будівля Б',
    domain: { _id: 'domain-1', name: 'Домен 1' },
    street: { _id: 'street-1', address: 'вул. Тестова, 1', city: 'Київ' },
  },
]

beforeEach(() => {
  ;(useGetCurrentUserQuery as jest.Mock).mockReturnValue({
    data: { roles: ['ADMIN'] },
  })
  ;(useGetAllRealEstateQuery as jest.Mock).mockReturnValue({
    data: {
      data: mockRealEstates,
      domainsFilter: [],
      realEstatesFilter: [],
      streetsFilter: [],
    },
    isLoading: false,
    isError: false,
  })
  ;(useGetCustomServicesQuery as jest.Mock).mockReturnValue({
    data: { data: [] },
  })
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('renderCurrency', () => {
  it('форматує ціле число через кому-розрядник', () => {
    expect(renderCurrency(12500)).toBe('12,500')
  })

  it('округлює до 2 знаків після коми', () => {
    expect(renderCurrency(1234.567)).toBe('1,234.57')
  })

  it('повертає "-" для undefined', () => {
    expect(renderCurrency(undefined)).toBe('-')
  })

  it('повертає "-" для null', () => {
    expect(renderCurrency(null)).toBe('-')
  })

  it('повертає "-" для не-числового рядка', () => {
    expect(renderCurrency('abc')).toBe('-')
  })

  it('форматує нуль як "0"', () => {
    expect(renderCurrency(0)).toBe('0')
  })

  it("форматує від'ємне число", () => {
    expect(renderCurrency(-100)).toBe('-100')
  })

  it('форматує велике число з розрядниками', () => {
    expect(renderCurrency(1000000)).toBe('1,000,000')
  })

  it('приймає рядкове число', () => {
    expect(renderCurrency('2500')).toBe('2,500')
  })
})

describe('renderPrice', () => {
  it('форматує звичайне числове значення', () => {
    expect(renderPrice(1500)).toBe('1,500')
  })

  it('повертає "-" для рядка', () => {
    expect(renderPrice('500' as any)).toBe('-')
  })

  it('повертає "-" для Infinity', () => {
    expect(renderPrice(Infinity)).toBe('-')
  })

  it('повертає "-" для NaN', () => {
    expect(renderPrice(NaN)).toBe('-')
  })

  it('повертає "-" для null', () => {
    expect(renderPrice(null as any)).toBe('-')
  })

  it('форматує нуль як "0"', () => {
    expect(renderPrice(0)).toBe('0')
  })
})

const PriceCell: React.FC<{ value: number | undefined }> = ({ value }) => (
  <span data-testid="cell">{value ? renderCurrency(value) : '-'}</span>
)

describe('PriceCell — цінові колонки таблиці', () => {
  it('форматує pricePerMeter', () => {
    const { getByTestId } = render(<PriceCell value={2000} />)
    expect(getByTestId('cell')).toHaveTextContent('2,000')
  })

  it('форматує servicePricePerMeter', () => {
    const { getByTestId } = render(<PriceCell value={3500.5} />)
    expect(getByTestId('cell')).toHaveTextContent('3,500.5')
  })

  it('форматує cleaning', () => {
    const { getByTestId } = render(<PriceCell value={300} />)
    expect(getByTestId('cell')).toHaveTextContent('300')
  })

  it('показує "-" для cleaning = 0', () => {
    const { getByTestId } = render(<PriceCell value={0} />)
    expect(getByTestId('cell')).toHaveTextContent('-')
  })

  it("відображає від'ємний discount (бекенд зберігає зі знаком «-»)", () => {
    const { getByTestId } = render(<PriceCell value={-10} />)
    expect(getByTestId('cell')).toHaveTextContent('-10')
  })

  it('показує "-" для discount = 0', () => {
    const { getByTestId } = render(<PriceCell value={0} />)
    expect(getByTestId('cell')).toHaveTextContent('-')
  })

  it('показує "-" для undefined', () => {
    const { getByTestId } = render(<PriceCell value={undefined} />)
    expect(getByTestId('cell')).toHaveTextContent('-')
  })
})

const CustomServiceCell: React.FC<{
  customServices: { _id: string; price: number }[]
  serviceId: string
}> = ({ customServices, serviceId }) => {
  const match = customServices.find((s) => String(s._id) === String(serviceId))
  return (
    <span data-testid="cell">
      {match?.price ? renderCurrency(match.price) : '-'}
    </span>
  )
}

describe('CustomServiceCell — кастомні сервіси', () => {
  it('відображає ціну кастомного сервісу', () => {
    const { getByTestId } = render(
      <CustomServiceCell
        customServices={[{ _id: 'cs-1', price: 800 }]}
        serviceId="cs-1"
      />
    )
    expect(getByTestId('cell')).toHaveTextContent('800')
  })

  it('показує "-" якщо ціна 0', () => {
    const { getByTestId } = render(
      <CustomServiceCell
        customServices={[{ _id: 'cs-2', price: 0 }]}
        serviceId="cs-2"
      />
    )
    expect(getByTestId('cell')).toHaveTextContent('-')
  })

  it('показує "-" якщо сервіс відсутній', () => {
    const { getByTestId } = render(
      <CustomServiceCell customServices={[]} serviceId="cs-999" />
    )
    expect(getByTestId('cell')).toHaveTextContent('-')
  })

  it('форматує велику ціну через кому-розрядник', () => {
    const { getByTestId } = render(
      <CustomServiceCell
        customServices={[{ _id: 'cs-3', price: 15000 }]}
        serviceId="cs-3"
      />
    )
    expect(getByTestId('cell')).toHaveTextContent('15,000')
  })
})

describe('RealEstateBlock — інтеграційно', () => {
  it('рендерить без помилок', () => {
    render(<RealEstateBlock domainId="domain-1" streetId="street-1" />)
    expect(screen.getByText('Компанії')).toBeInTheDocument()
  })

  it('відображає назви компаній', () => {
    render(<RealEstateBlock domainId="domain-1" streetId="street-1" />)
    expect(screen.getByText('Компанія А')).toBeInTheDocument()
    expect(screen.getByText('Компанія Б')).toBeInTheDocument()
  })

  it('відображає pricePerMeter Компанії А', () => {
    render(<RealEstateBlock domainId="domain-1" streetId="street-1" />)
    expect(screen.getByText('2,000')).toBeInTheDocument()
  })

  it('відображає pricePerMeter Компанії', () => {
    render(<RealEstateBlock domainId="domain-1" streetId="street-1" />)
    expect(screen.getByText('1,500')).toBeInTheDocument()
  })

  it('відображає cleaning Компанії А', () => {
    render(<RealEstateBlock domainId="domain-1" streetId="street-1" />)
    expect(screen.getByText('300')).toBeInTheDocument()
  })

  it('відображає "-" для cleaning Компанії Б', () => {
    render(<RealEstateBlock domainId="domain-1" streetId="street-1" />)
    const cells = screen.getAllByText('-')
    expect(cells.length).toBeGreaterThan(0)
  })

  it('не ламається коли data порожній масив', () => {
    ;(useGetAllRealEstateQuery as jest.Mock).mockReturnValueOnce({
      data: { data: [] },
      isLoading: false,
      isError: false,
    })
    render(<RealEstateBlock domainId="domain-1" streetId="street-1" />)
    expect(screen.getByText('Компанії')).toBeInTheDocument()
  })

  it('не ламається під час завантаження (isLoading: true)', () => {
    ;(useGetAllRealEstateQuery as jest.Mock).mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      isError: false,
    })
    render(<RealEstateBlock domainId="domain-1" streetId="street-1" />)
    expect(screen.getByText('Компанії')).toBeInTheDocument()
  })

  it('показує помилку при isError: true', () => {
    ;(useGetAllRealEstateQuery as jest.Mock).mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
    })
    render(<RealEstateBlock domainId="domain-1" streetId="street-1" />)
    expect(screen.getByText('Помилка')).toBeInTheDocument()
  })
})

describe('Edge-cases валюти', () => {
  it('не ламається на числі з багатьма знаками після коми', () => {
    expect(renderCurrency(1.00004)).toBe('1')
  })

  it('рендерить 1.5 коректно', () => {
    expect(renderCurrency(1.5)).toBe('1.5')
  })

  it('0 — це "0", а не "-" для renderCurrency', () => {
    expect(renderCurrency(0)).toBe('0')
  })

  it('0 — це "0", а не "-" для renderPrice', () => {
    expect(renderPrice(0)).toBe('0')
  })
})
