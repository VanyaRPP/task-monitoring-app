import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CustomServicesTable } from './Table'
import { Roles } from '@utils/constants'

jest.mock('@utils/servicesVisibility', () => ({
  getVisibleServices: jest.fn((roles, adminDomains, allServices) => {
    if (roles?.includes(Roles.DOMAIN_ADMIN)) {
      const validDomainIds = adminDomains.map((d: any) => d._id)
      return allServices.filter((s: any) => validDomainIds.includes(s.domain))
    }
    return allServices
  }),
  getDomainTypeTemplateCategoryLabel: jest.fn((cat) => cat),
}))

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))

jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesQuery: jest.fn(),
  useDeleteCustomServiceMutation: jest.fn(() => [jest.fn()]),
  useEditCustomServiceMutation: jest.fn(() => [
    jest.fn(),
    { isLoading: false },
  ]),
}))

jest.mock('@common/api/domainApi/domain.api', () => ({
  useGetDomainsByAdminQuery: jest.fn(),
  useGetDomainsQuery: jest.fn(),
  useGetDomainTypeTemplatesQuery: jest.fn(() => ({ data: [] })),
}))

const mockServices = [
  {
    _id: 's1',
    name: 'Service Own 1',
    domain: 'domain-own',
    category: 'utility',
  },
  {
    _id: 's2',
    name: 'Service Own 2',
    domain: 'domain-own',
    category: 'utility',
  },
  {
    _id: 's3',
    name: 'Service Foreign',
    domain: 'domain-foreign',
    category: 'utility',
  },
]

const mockAdminDomains = [{ _id: 'domain-own', name: 'My Domain' }]

describe('CustomServicesTable - Права доступу Domain Admin', () => {
  const mockUseGetCurrentUserQuery =
    require('@common/api/userApi/user.api').useGetCurrentUserQuery
  const mockUseGetCustomServicesQuery =
    require('@common/api/customServicesApi/customServices.api').useGetCustomServicesQuery
  const mockUseGetDomainsByAdminQuery =
    require('@common/api/domainApi/domain.api').useGetDomainsByAdminQuery
  const mockUseGetDomainsQuery =
    require('@common/api/domainApi/domain.api').useGetDomainsQuery

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseGetCustomServicesQuery.mockReturnValue({
      data: { data: mockServices },
      isLoading: false,
    })

    mockUseGetDomainsByAdminQuery.mockReturnValue({ data: mockAdminDomains })
    mockUseGetDomainsQuery.mockReturnValue({ data: [] })
  })

  it('Тест-кейс 1: Domain Admin бачить послуги своїх доменів', () => {
    mockUseGetCurrentUserQuery.mockReturnValue({
      data: { roles: [Roles.DOMAIN_ADMIN] },
    })

    render(<CustomServicesTable />)

    expect(screen.getByText('Service Own 1')).toBeInTheDocument()
    expect(screen.getByText('Service Own 2')).toBeInTheDocument()
  })

  it('Тест-кейс 2: Domain Admin не бачить послуги чужих доменів', () => {
    mockUseGetCurrentUserQuery.mockReturnValue({
      data: { roles: [Roles.DOMAIN_ADMIN] },
    })

    render(<CustomServicesTable />)

    expect(screen.queryByText('Service Foreign')).not.toBeInTheDocument()
  })
})
