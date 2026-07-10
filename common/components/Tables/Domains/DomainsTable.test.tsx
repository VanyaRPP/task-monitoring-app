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

import {
  useGetDomainsQuery,
  useDeleteDomainMutation,
  useEditDomainMutation,
  useUpdateArchivedDomainMutation,
} from '@common/api/domainApi/domain.api'

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

beforeEach(() => {
  jest.clearAllMocks()
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
