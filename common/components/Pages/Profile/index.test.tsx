import React from 'react'
import { render, screen } from '@testing-library/react'
import { ProfilePage } from '.'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useSession } from 'next-auth/react'
import {
  useGetDomainFiltersQuery,
  useGetRealEstateFiltersQuery,
} from '@common/api/filterApi/filter.api'

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))

jest.mock('@common/api/filterApi/filter.api', () => ({
  useGetDomainFiltersQuery: jest.fn(),
  useGetRealEstateFiltersQuery: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}))

jest.mock(
  '@common/components/Pages/Profile/Modal/AddFeatureFlagModal',
  () => () => null
)
jest.mock('@common/components/FeatureFlagsTable', () => ({
  FeatureFlagsTable: () => null,
}))
jest.mock('@components/Tables/UsersTable', () => ({
  UsersTable: () => null,
}))
jest.mock('../../Forms/EditUserForm', () => ({
  EditUserForm: () => null,
}))

jest.mock('antd', () => {
  const React = require('react')
  const actual = jest.requireActual('antd')
  return {
    ...actual,
    Tooltip: ({
      title,
      children,
    }: {
      title: React.ReactNode
      children: React.ReactNode
    }) =>
      React.createElement(
        React.Fragment,
        null,
        React.createElement('span', { 'data-testid': 'tooltip-title' }, title),
        children
      ),
  }
})

const setWidths = (scrollWidth: number, clientWidth: number) => {
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    value: scrollWidth,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    value: clientWidth,
  })
}

describe('/profile page', () => {
  beforeEach(() => {
    ;(useGetDomainFiltersQuery as jest.Mock).mockReturnValue({
      data: { domainsFilter: [] },
    })
    ;(useGetRealEstateFiltersQuery as jest.Mock).mockReturnValue({
      data: { realEstatesFilter: [] },
    })
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { image: '' } },
    })
  })

  afterEach(() => {
    delete (HTMLElement.prototype as any).scrollWidth
    delete (HTMLElement.prototype as any).clientWidth
  })

  it('renders a short user name in full with no tooltip', () => {
    setWidths(50, 50)
    ;(useGetCurrentUserQuery as jest.Mock).mockReturnValue({
      data: { name: 'X', roles: [] },
    })

    render(<ProfilePage />)

    expect(screen.getByText('X')).toBeInTheDocument()
    expect(screen.queryByTestId('tooltip-title')).not.toBeInTheDocument()
  })

  it('truncates a long user name and exposes it via tooltip', () => {
    setWidths(300, 50)
    const longName = 'Дуже довге ім’я користувача, яке не поміщається у блок'
    ;(useGetCurrentUserQuery as jest.Mock).mockReturnValue({
      data: { name: longName, roles: [] },
    })

    render(<ProfilePage />)

    expect(screen.getByTestId('tooltip-title')).toHaveTextContent(longName)
  })

  it('truncates a long company tag name in "Адміністратор Компаній"', () => {
    setWidths(300, 50)
    const longCompany =
      'Товариство з обмеженою відповідальністю "Інноваційні рішення для бізнесу"'
    ;(useGetCurrentUserQuery as jest.Mock).mockReturnValue({
      data: { name: 'X', roles: [] },
    })
    ;(useGetRealEstateFiltersQuery as jest.Mock).mockReturnValue({
      data: { realEstatesFilter: [{ text: longCompany }] },
    })

    render(<ProfilePage />)

    const tooltipTexts = screen
      .getAllByTestId('tooltip-title')
      .map((el) => el.textContent)
    expect(tooltipTexts.some((text) => text?.includes(longCompany))).toBe(true)
  })
})
