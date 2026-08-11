import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import CompaniesTable from './Table'
import { IGetRealestateResponse } from '@common/api/realestateApi/realestate.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useGetDebtorsQuery } from '@common/api/debtorsApi/debtors.api'
import { useGetRealEstateFiltersQuery } from '@common/api/filterApi/filter.api'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useDeleteRealEstateMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useUpdateArchivedItemMutation: jest.fn(() => [
    jest.fn(),
    { isLoading: false },
  ]),
}))

const mockFilterData = {
  streetsFilter: [],
  domainsFilter: [{ value: 'domain1', text: 'Domain 1' }],
  realEstatesFilter: [
    { value: '1', text: 'Company A' },
    { value: '2', text: 'Company B' },
  ],
}

jest.mock('@common/api/filterApi/filter.api', () => ({
  useGetAddressFiltersQuery: jest.fn(),
  useGetDomainFiltersQuery: jest.fn(),
  useGetRealEstateFiltersQuery: jest.fn(),
}))

jest.mock('@common/api/domainApi/domain.api', () => ({
  useGetDomainTypeTemplatesQuery: jest.fn(() => ({ data: [] })),
}))

jest.mock('@common/api/debtorsApi/debtors.api', () => ({
  useGetDebtorsQuery: jest.fn(),
}))

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    pathname: '/real-estate',
  })),
}))

const mockProps = {
  realEstates: {
    data: [
      {
        _id: '1',
        companyName: 'Company A',
        domain: { _id: 'domain1', name: 'Domain 1' },
        street: { address: 'Street 1', city: 'City 1' },
        adminEmails: [],
      },
    ],
    success: true,
  } as IGetRealestateResponse,
  isLoading: false,
  isError: false,
  filters: {},
  setFilters: jest.fn(),
  setRealEstateActions: jest.fn(),
  realEstateActions: { edit: false },
  isArchive: false,
  customServices: [],
}

const mockDebtors = (totalDebt: number) => {
  ;(useGetDebtorsQuery as jest.Mock).mockReturnValue({
    data: {
      companies: [
        {
          companyId: '1',
          companyName: 'Company A',
          debtPerMonth: [],
          totalDebt,
        },
      ],
    },
  })
}

const badgeCount = () => document.querySelector('.ant-badge-count')?.textContent

const badgeColor = () => {
  const el = document.querySelector('.ant-badge-count') as HTMLElement
  if (!el) return undefined
  const preset = Array.from(el.classList).find((c) =>
    c.startsWith('ant-badge-color-')
  )
  return preset ? preset.replace('ant-badge-color-', '') : el.style.background
}

describe('CompaniesTable debtor badge', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useGetCurrentUserQuery as jest.Mock).mockReturnValue({
      data: { roles: ['global_admin'] },
    })
    ;(useGetRealEstateFiltersQuery as jest.Mock).mockReturnValue({
      data: mockFilterData,
    })
    const { useGetAddressFiltersQuery, useGetDomainFiltersQuery } =
      jest.requireMock('@common/api/filterApi/filter.api')
    ;(useGetAddressFiltersQuery as jest.Mock).mockReturnValue({
      data: mockFilterData,
    })
    ;(useGetDomainFiltersQuery as jest.Mock).mockReturnValue({
      data: mockFilterData,
    })
  })

  test('renders the debt amount when the company owes the domain', () => {
    mockDebtors(1500)
    render(<CompaniesTable {...mockProps} />)

    expect(document.querySelector('.ant-badge')).toBeInTheDocument()
    expect(badgeCount()).toBe('1500.00')
    expect(badgeColor()).toBe('gray')
  })

  test('renders a signed amount when the domain owes the company', () => {
    mockDebtors(-1500)
    render(<CompaniesTable {...mockProps} />)

    expect(document.querySelector('.ant-badge')).toBeInTheDocument()
    expect(badgeCount()).toBe('-1500.00')
  })

  test('uses a different badge color for each debt direction', () => {
    mockDebtors(1500)
    const { unmount } = render(<CompaniesTable {...mockProps} />)
    const positiveColor = badgeColor()
    unmount()

    mockDebtors(-1500)
    render(<CompaniesTable {...mockProps} />)
    const negativeColor = badgeColor()

    expect(positiveColor).toBe('gray')
    expect(negativeColor).toBe('cyan')
  })

  test('labels the tooltip as an overpayment when the debt is negative', async () => {
    mockDebtors(-1500)
    render(<CompaniesTable {...mockProps} />)

    await userEvent.hover(screen.getByText('Company A'))

    expect(await screen.findByText('Переплата компанії')).toBeInTheDocument()
    expect(screen.getByText(/Сума переплати/)).toBeInTheDocument()
    expect(screen.queryByText('Компанія боржник')).not.toBeInTheDocument()
  })

  test('labels the tooltip as a debt when the debt is positive', async () => {
    mockDebtors(1500)
    render(<CompaniesTable {...mockProps} />)

    await userEvent.hover(screen.getByText('Company A'))

    expect(await screen.findByText('Компанія боржник')).toBeInTheDocument()
    expect(screen.getByText(/Сума боргу/)).toBeInTheDocument()
    expect(screen.queryByText('Переплата компанії')).not.toBeInTheDocument()
  })

  test('does not render a badge for a company without a debt record', () => {
    ;(useGetDebtorsQuery as jest.Mock).mockReturnValue({
      data: { companies: [] },
    })
    render(<CompaniesTable {...mockProps} />)

    expect(document.querySelector('.ant-badge')).not.toBeInTheDocument()
  })
})

describe('CompaniesTable "Боржники" switch', () => {
  const setFilters = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useGetCurrentUserQuery as jest.Mock).mockReturnValue({
      data: { roles: ['global_admin'] },
    })
    ;(useGetRealEstateFiltersQuery as jest.Mock).mockReturnValue({
      data: mockFilterData,
    })
    const { useGetAddressFiltersQuery, useGetDomainFiltersQuery } =
      jest.requireMock('@common/api/filterApi/filter.api')
    ;(useGetAddressFiltersQuery as jest.Mock).mockReturnValue({
      data: mockFilterData,
    })
    ;(useGetDomainFiltersQuery as jest.Mock).mockReturnValue({
      data: mockFilterData,
    })
  })

  const appliedCompanyFilter = () => {
    const updater = setFilters.mock.calls.at(-1)?.[0]
    return typeof updater === 'function' ? updater({}).company : updater
  }

  test('filters to companies that owe the domain, excluding overpaid ones', async () => {
    ;(useGetDebtorsQuery as jest.Mock).mockReturnValue({
      data: {
        companies: [
          { companyId: '1', companyName: 'Debtor', totalDebt: 1500 },
          { companyId: '2', companyName: 'Overpaid', totalDebt: -1500 },
          { companyId: '3', companyName: 'Big debtor', totalDebt: 25000 },
        ],
      },
    })
    render(<CompaniesTable {...mockProps} setFilters={setFilters} />)

    await userEvent.click(screen.getByRole('switch'))

    expect(appliedCompanyFilter()).toEqual(['1', '3'])
  })

  test('applies an empty filter when every company is overpaid', async () => {
    ;(useGetDebtorsQuery as jest.Mock).mockReturnValue({
      data: {
        companies: [
          { companyId: '1', companyName: 'Overpaid', totalDebt: -1500 },
        ],
      },
    })
    render(<CompaniesTable {...mockProps} setFilters={setFilters} />)

    await userEvent.click(screen.getByRole('switch'))

    expect(appliedCompanyFilter()).toEqual([])
  })

  test('clears the filter when toggled back off', async () => {
    ;(useGetDebtorsQuery as jest.Mock).mockReturnValue({
      data: {
        companies: [{ companyId: '1', companyName: 'Debtor', totalDebt: 1500 }],
      },
    })
    render(<CompaniesTable {...mockProps} setFilters={setFilters} />)

    const toggle = screen.getByRole('switch')
    await userEvent.click(toggle)
    await userEvent.click(toggle)

    expect(setFilters).toHaveBeenLastCalledWith(undefined)
  })
})
