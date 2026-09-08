import React from 'react'
import { render, screen } from '@testing-library/react'
import { Profile } from '.'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useSession } from 'next-auth/react'
import {
  useGetDomainFiltersQuery,
  useGetRealEstateFiltersQuery,
} from '@common/api/filterApi/filter.api'

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useGetAllRealEstateQuery: jest.fn(() => ({ data: undefined })),
}))

jest.mock('@common/api/filterApi/filter.api', () => ({
  useGetDomainFiltersQuery: jest.fn(),
  useGetRealEstateFiltersQuery: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('@utils/env', () => ({
  isDev: false,
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

describe('Profile (mini profile popover)', () => {
  beforeEach(() => {
    ;(useGetDomainFiltersQuery as jest.Mock).mockReturnValue({
      data: { domainsFilter: [] },
    })
    ;(useGetRealEstateFiltersQuery as jest.Mock).mockReturnValue({
      data: { realEstatesFilter: [] },
    })
  })

  afterEach(() => {
    delete (HTMLElement.prototype as any).scrollWidth
    delete (HTMLElement.prototype as any).clientWidth
  })

  it('renders a short user name in full with no tooltip', () => {
    setWidths(50, 50)
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { name: 'X', email: 'x@test.com' } },
    })
    ;(useGetCurrentUserQuery as jest.Mock).mockReturnValue({
      data: { roles: [] },
    })

    render(<Profile />)

    expect(screen.getByText('X')).toBeInTheDocument()
    expect(screen.queryByTestId('tooltip-title')).not.toBeInTheDocument()
  })

  it('truncates a long user name and exposes it via tooltip', () => {
    setWidths(300, 50)
    const longName = 'Дуже довге ім’я користувача, яке не поміщається у блок'
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { name: longName, email: 'x@test.com' } },
    })
    ;(useGetCurrentUserQuery as jest.Mock).mockReturnValue({
      data: { roles: [] },
    })

    render(<Profile />)

    expect(screen.getByTestId('tooltip-title')).toHaveTextContent(longName)
  })

  it('truncates a long company tag name inside the companies list', () => {
    setWidths(300, 50)
    const longCompany =
      'Товариство з обмеженою відповідальністю "Інноваційні рішення для бізнесу"'
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { name: 'X', email: 'x@test.com' } },
    })
    ;(useGetCurrentUserQuery as jest.Mock).mockReturnValue({
      data: { roles: [] },
    })
    ;(useGetRealEstateFiltersQuery as jest.Mock).mockReturnValue({
      data: { realEstatesFilter: [{ text: longCompany }] },
    })

    render(<Profile />)

    const tooltipTexts = screen
      .getAllByTestId('tooltip-title')
      .map((el) => el.textContent)
    expect(tooltipTexts.some((text) => text?.includes(longCompany))).toBe(true)
  })
})
