import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { CustomServicesTable } from './Table'
import { Roles, defaultServices, ServiceType } from '@utils/constants'

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

const editServiceMock = jest.fn(() => ({ unwrap: () => Promise.resolve({}) }))

jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesQuery: jest.fn(),
  useDeleteCustomServiceMutation: jest.fn(() => [jest.fn()]),
  useEditCustomServiceMutation: jest.fn(() => [
    editServiceMock,
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

describe('CustomServicesTable - Тип послуги (serviceType)', () => {
  const mockUseGetCurrentUserQuery =
    require('@common/api/userApi/user.api').useGetCurrentUserQuery
  const mockUseGetCustomServicesQuery =
    require('@common/api/customServicesApi/customServices.api').useGetCustomServicesQuery
  const mockUseGetDomainsByAdminQuery =
    require('@common/api/domainApi/domain.api').useGetDomainsByAdminQuery
  const mockUseGetDomainsQuery =
    require('@common/api/domainApi/domain.api').useGetDomainsQuery

  const utilityCustomWithType = {
    _id: 'custom-elec',
    name: 'Електропостачання (кастом)',
    domain: 'domain-util',
    category: 'utility',
    serviceType: ServiceType.Electricity,
  }
  const customNoType = {
    _id: 'custom-plain',
    name: 'Інтернет',
    domain: 'domain-util',
    category: 'utility',
  }
  const systemService = {
    _id: defaultServices[1],
    name: 'Електропостачання (системна)',
    category: 'utility',
    serviceType: ServiceType.Electricity,
  }

  const renderAsGlobalAdmin = (services: any[]) => {
    mockUseGetCurrentUserQuery.mockReturnValue({
      data: { roles: [Roles.GLOBAL_ADMIN] },
    })
    mockUseGetCustomServicesQuery.mockReturnValue({
      data: { data: services },
      isLoading: false,
    })
    mockUseGetDomainsByAdminQuery.mockReturnValue({ data: [] })
    mockUseGetDomainsQuery.mockReturnValue({ data: [] })
    return render(<CustomServicesTable />)
  }

  const editButtonFor = (name: string) => {
    const row = screen.getByText(name).closest('tr') as HTMLElement
    return within(row).getByLabelText('edit').closest('button') as HTMLElement
  }

  const deleteButtonFor = (name: string) => {
    const row = screen.getByText(name).closest('tr') as HTMLElement
    return within(row).getByLabelText('delete').closest('button') as HTMLElement
  }

  beforeEach(() => {
    jest.clearAllMocks()
    editServiceMock.mockReturnValue({ unwrap: () => Promise.resolve({}) })
  })

  it('bug #1: a custom service we made communal (has serviceType) stays editable', () => {
    renderAsGlobalAdmin([utilityCustomWithType])
    expect(editButtonFor('Електропостачання (кастом)')).not.toBeDisabled()
  })

  it('a built-in "always communal" system service stays locked (edit + delete)', () => {
    renderAsGlobalAdmin([systemService])
    expect(editButtonFor('Електропостачання (системна)')).toBeDisabled()
    expect(deleteButtonFor('Електропостачання (системна)')).toBeDisabled()
  })

  it('edit modal shows "Тип послуги" preset to the service\'s current type', async () => {
    renderAsGlobalAdmin([utilityCustomWithType])
    await userEvent.click(editButtonFor('Електропостачання (кастом)'))

    expect(await screen.findByText('Тип послуги')).toBeInTheDocument()
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Електропостачання')).toBeInTheDocument()
  })

  it('offers communal types even for a non-communal (auto) category service', async () => {
    const autoService = {
      _id: 'auto-1',
      name: 'Мийка',
      domain: 'domain-auto',
      category: 'auto',
    }
    renderAsGlobalAdmin([autoService])
    await userEvent.click(editButtonFor('Мийка'))
    await screen.findByText('Тип послуги')

    const dialog = screen.getByRole('dialog')
    await userEvent.click(within(dialog).getByRole('combobox'))

    expect(await screen.findByText('Електропостачання')).toBeInTheDocument()
  })

  it('saving sends the assigned serviceType to the backend', async () => {
    renderAsGlobalAdmin([utilityCustomWithType])
    await userEvent.click(editButtonFor('Електропостачання (кастом)'))
    await screen.findByText('Тип послуги')

    await userEvent.click(screen.getByRole('button', { name: /Зберегти/ }))

    await waitFor(() => expect(editServiceMock).toHaveBeenCalledTimes(1))
    expect(editServiceMock).toHaveBeenCalledWith({
      _id: 'custom-elec',
      name: 'Електропостачання (кастом)',
      serviceType: ServiceType.Electricity,
    })
  })

  it('saving a service with no type sends serviceType: null (clear)', async () => {
    renderAsGlobalAdmin([customNoType])
    await userEvent.click(editButtonFor('Інтернет'))
    await screen.findByText('Тип послуги')

    await userEvent.click(screen.getByRole('button', { name: /Зберегти/ }))

    await waitFor(() => expect(editServiceMock).toHaveBeenCalledTimes(1))
    expect(editServiceMock).toHaveBeenCalledWith({
      _id: 'custom-plain',
      name: 'Інтернет',
      serviceType: null,
    })
  })
})
