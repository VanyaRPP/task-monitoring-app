import React from 'react'
import { render, screen } from '@testing-library/react'
import DomainsTable from './Table'
import '@testing-library/jest-dom'

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/domains',
  }),
}))

jest.mock('@common/api/domainApi/domain.api', () => ({
  useGetDomainsQuery: jest.fn(),
  useDeleteDomainMutation: jest.fn(),
  useEditDomainMutation: jest.fn(),
  useUpdateArchivedDomainMutation: jest.fn(),
}))

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))

jest.mock('antd', () => {
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

import {
  useGetDomainsQuery,
  useDeleteDomainMutation,
  useEditDomainMutation,
  useUpdateArchivedDomainMutation,
} from '@common/api/domainApi/domain.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { Roles } from '@utils/constants'

const mockDomains = [
  {
    _id: '1',
    name: 'Van PRO Ltd.',
    adminEmails: ['admin@test.com'],
    description: 'Test domain',
  },
  {
    _id: '2',
    name: 'Rozetka',
    adminEmails: ['admin@rozetka.ua'],
    description: 'Second domain',
  },
]

const renderComponent = (props = {}) =>
  render(
    <DomainsTable
      domainId={null}
      setCurrentDomain={jest.fn()}
      setDomainActions={jest.fn()}
      setDomainsLength={jest.fn()}
      domainActions={{ edit: false }}
      isArchive={false}
      {...props}
    />
  )

const mockCurrentUser = (roles: string[]) =>
  (useGetCurrentUserQuery as jest.Mock).mockReturnValue({
    data: { roles },
  })

beforeEach(() => {
  jest.clearAllMocks()
  mockCurrentUser([Roles.DOMAIN_ADMIN])
  ;(useDeleteDomainMutation as jest.Mock).mockReturnValue([
    jest.fn(),
    { isLoading: false },
  ])
  ;(useEditDomainMutation as jest.Mock).mockReturnValue([
    jest.fn(),
    { isLoading: false },
  ])
  ;(useUpdateArchivedDomainMutation as jest.Mock).mockReturnValue([
    jest.fn(),
    { isLoading: false },
  ])
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('long domain names', () => {
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

  afterEach(() => {
    delete (HTMLElement.prototype as any).scrollWidth
    delete (HTMLElement.prototype as any).clientWidth
  })

  it('renders a short domain name in full with no tooltip', () => {
    setWidths(50, 50)
    ;(useGetDomainsQuery as jest.Mock).mockReturnValue({
      data: mockDomains,
      isLoading: false,
      isError: false,
    })

    renderComponent()

    expect(screen.getByText('Rozetka')).toBeInTheDocument()
  })

  it('truncates a long domain name and exposes it via a title attribute on hover', () => {
    setWidths(300, 50)
    const longName =
      'Товариство з обмеженою відповідальністю "Інноваційні рішення для бізнесу"'
    ;(useGetDomainsQuery as jest.Mock).mockReturnValue({
      data: [
        {
          _id: '3',
          name: longName,
          adminEmails: [],
          description: 'Long name domain',
        },
      ],
      isLoading: false,
      isError: false,
    })

    renderComponent()

    // antd renders a fixed column's cells twice (real + hidden measure row).
    expect(screen.getAllByText(longName).length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('tooltip-title')[0]).toHaveTextContent(
      longName
    )
  })
})

it('renders domains table with data', () => {
  ;(useGetDomainsQuery as jest.Mock).mockReturnValue({
    data: mockDomains,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })

  renderComponent()

  expect(screen.getByText('Van PRO Ltd.')).toBeInTheDocument()
  expect(screen.getByText('Rozetka')).toBeInTheDocument()
})

it('calls setDomainsLength after data load', () => {
  const setDomainsLength = jest.fn()

  ;(useGetDomainsQuery as jest.Mock).mockReturnValue({
    data: mockDomains,
    isLoading: false,
    isError: false,
  })

  renderComponent({ setDomainsLength })

  expect(setDomainsLength).toHaveBeenCalledWith(2)
})

it('shows error alert when request fails', () => {
  ;(useGetDomainsQuery as jest.Mock).mockReturnValue({
    data: null,
    isLoading: false,
    isError: true,
  })

  renderComponent()

  expect(screen.getByText('Помилка')).toBeInTheDocument()
})

it('hides "Надавачі послуг" column when only one company in filter', () => {
  const singleCompany = [
    {
      _id: '1',
      name: 'Van PRO Ltd.',
      adminEmails: ['admin@test.com'],
      description: 'Test domain',
      companies: ['Single Company'],
    },
  ]

  ;(useGetDomainsQuery as jest.Mock).mockReturnValue({
    data: singleCompany,
    isLoading: false,
    isError: false,
  })

  renderComponent()

  expect(screen.queryByText('Надавачі послуг')).not.toBeInTheDocument()
})

describe('row actions by access level', () => {
  beforeEach(() => {
    ;(useGetDomainsQuery as jest.Mock).mockReturnValue({
      data: mockDomains,
      isLoading: false,
      isError: false,
    })
  })

  it('offers preview plus the admin actions to a DomainAdmin', () => {
    mockCurrentUser([Roles.DOMAIN_ADMIN])
    const { container } = renderComponent()

    expect(container.querySelector('.anticon-eye')).toBeInTheDocument()
    expect(container.querySelector('.anticon-edit')).toBeInTheDocument()
    expect(container.querySelector('.anticon-more')).toBeInTheDocument()
  })

  it('leaves a view-only User with preview only', () => {
    mockCurrentUser([Roles.USER])
    const { container } = renderComponent()

    expect(container.querySelector('.anticon-eye')).toBeInTheDocument()
    expect(container.querySelector('.anticon-edit')).not.toBeInTheDocument()
    expect(container.querySelector('.anticon-more')).not.toBeInTheDocument()
  })

  it('treats an account with no roles as view-only', () => {
    mockCurrentUser([])
    const { container } = renderComponent()

    expect(container.querySelector('.anticon-eye')).toBeInTheDocument()
    expect(container.querySelector('.anticon-edit')).not.toBeInTheDocument()
  })
})
