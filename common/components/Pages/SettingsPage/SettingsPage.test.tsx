import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AdminPanelPage } from './index'
import { Roles } from '@utils/constants'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useGetCustomServicesQuery } from '@common/api/customServicesApi/customServices.api'
import {
  useGetDomainsByAdminQuery,
  useGetDomainsQuery,
  useGetDomainTypeTemplatesQuery,
} from '@common/api/domainApi/domain.api'

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

// Mock API hooks
jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))

jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesQuery: jest.fn(),
  useDeleteCustomServiceMutation: jest.fn(() => [
    jest.fn(),
    { isLoading: false },
  ]),
  useEditCustomServiceMutation: jest.fn(() => [
    jest.fn(),
    { isLoading: false },
  ]),
}))

jest.mock('@common/api/domainApi/domain.api', () => ({
  useGetDomainsByAdminQuery: jest.fn(),
  useGetDomainsQuery: jest.fn(),
  useGetDomainTypeTemplatesQuery: jest.fn(),
}))

jest.mock('@common/components/FeatureFlagsTable', () => ({
  FeatureFlagsTable: () => <div data-testid="feature-flags-table" />,
}))

jest.mock('@common/components/Tables/UsersTable', () => ({
  UsersTable: () => <div data-testid="users-table" />,
}))

jest.mock('@common/components/Tables/DomainTypeTemplates', () => ({
  DomainTypeTemplatesTable: () => (
    <div data-testid="domain-type-templates-table" />
  ),
}))

jest.mock('@components/Tables/LogConsoleTable/Table', () => ({
  LogsConsole: () => <div data-testid="logs-console" />,
}))

jest.mock('@common/components/Pages/Profile/Modal/AddFeatureFlagModal', () => ({
  __esModule: true,
  default: () => <div data-testid="feature-flag-modal" />,
}))

const mockCustomServices = [
  {
    _id: 'service1',
    name: 'Service 1',
    domain: 'domain1',
    serviceType: 'Custom',
  },
  {
    _id: 'service2',
    name: 'Service 2',
    domain: 'domain1',
    serviceType: 'Custom',
  },
  {
    _id: 'service3',
    name: 'Service 3',
    domain: 'domain2',
    serviceType: 'Custom',
  },
]

const mockDomain1 = {
  _id: 'domain1',
  name: 'Domain 1',
  customServices: [
    { groupName: 'Group A', services: ['service1', 'service2'] },
  ],
}

const mockDomain2 = {
  _id: 'domain2',
  name: 'Domain 2',
  customServices: [{ groupName: 'Group B', services: ['service3'] }],
}

const mockTemplates = []

const setupMocks = ({ adminDomains = [mockDomain1] } = {}) => {
  ;(useGetCurrentUserQuery as jest.Mock).mockReturnValue({
    data: {
      roles: [Roles.DOMAIN_ADMIN],
    },
  })
  ;(useGetDomainsByAdminQuery as jest.Mock).mockReturnValue({
    data: adminDomains,
  })
  ;(useGetDomainsQuery as jest.Mock).mockReturnValue({
    data: [],
  })
  ;(useGetCustomServicesQuery as jest.Mock).mockReturnValue({
    data: { data: mockCustomServices },
    isLoading: false,
  })
  ;(useGetDomainTypeTemplatesQuery as jest.Mock).mockReturnValue({
    data: mockTemplates,
  })
}

describe('<AdminPanelPage /> — Domain Admin services visibility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupMocks()
  })

  it('shows services for all domains that belong to the Domain Admin', async () => {
    setupMocks({ adminDomains: [mockDomain1, mockDomain2] })

    render(<AdminPanelPage />)

    const servicesTab = await screen.findByRole('tab', { name: 'Послуги' })
    fireEvent.click(servicesTab)

    expect(await screen.findByText('Service 1')).toBeInTheDocument()
    expect(screen.getByText('Service 2')).toBeInTheDocument()
    expect(screen.getByText('Service 3')).toBeInTheDocument()
  })

  it('does not show services from domains the Domain Admin does not own', async () => {
    setupMocks({ adminDomains: [mockDomain1] })

    render(<AdminPanelPage />)

    const servicesTab = await screen.findByRole('tab', { name: 'Послуги' })
    fireEvent.click(servicesTab)

    expect(await screen.findByText('Service 1')).toBeInTheDocument()
    expect(screen.getByText('Service 2')).toBeInTheDocument()
    expect(screen.queryByText('Service 3')).not.toBeInTheDocument()
  })
})
