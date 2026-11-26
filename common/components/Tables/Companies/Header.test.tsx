import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import CompaniesHeader from './Header'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useAccessibleCustomServices } from '@common/api/customServicesApi/useAccessibleCustomServices'
import { useGetDomainTypeTemplatesQuery } from '@common/api/domainApi/domain.api'
import { Roles } from '@utils/constants'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))

jest.mock('@common/api/customServicesApi/useAccessibleCustomServices', () => ({
  useAccessibleCustomServices: jest.fn(),
}))

jest.mock('@common/api/domainApi/domain.api', () => ({
  useGetDomainTypeTemplatesQuery: jest.fn(),
}))

jest.mock('@common/api/filterApi/filter.api', () => ({
  useGetDomainFiltersQuery: jest.fn(() => ({ data: undefined })),
  useGetRealEstateFiltersQuery: jest.fn(() => ({ data: undefined })),
}))

jest.mock('@utils/helpers', () => ({
  isAdminCheck: jest.fn(() => false),
}))

jest.mock('@components/UI/RealEstateComponents/RealEstateModal', () => {
  const MockModal = () => <div data-testid="real-estate-modal" />
  MockModal.displayName = 'RealEstateModal'
  return MockModal
})

jest.mock('@components/UI/Reusable/FilterTags', () => ({
  DomainFilterTags: () => <div data-testid="domain-tags" />,
  CompanyFilterTags: () => <div data-testid="company-tags" />,
}))

const ALL_SERVICES = [
  { _id: 's1', name: 'Вивіз сміття' },
  { _id: 's2', name: 'Прибирання (грн)' },
  { _id: 's3', name: 'Електропостачання' },
]

const makeRealEstates = (domainId: string, serviceIds: string[]) =>
  ({
    data: [
      {
        _id: `re-${domainId}`,
        domain: {
          _id: domainId,
          customServices: [{ groupName: 'Група', services: serviceIds }],
        },
      },
    ],
  }) as any

const renderHeader = (
  props: Partial<React.ComponentProps<typeof CompaniesHeader>> = {}
) => {
  const setFilters = jest.fn()
  const utils = render(
    <CompaniesHeader
      filters={{}}
      setFilters={setFilters}
      realEstates={makeRealEstates('d1', ['s1', 's2', 's3'])}
      realEstateActions={{ edit: false }}
      setRealEstateActions={jest.fn()}
      {...props}
    />
  )
  return { setFilters, ...utils }
}

const openDropdown = () => fireEvent.mouseDown(screen.getByRole('combobox'))

const typeInSearch = (text: string) =>
  fireEvent.change(screen.getByRole('combobox'), { target: { value: text } })

describe('CompaniesHeader — фільтр послуг', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ pathname: '/' })
    ;(useGetCurrentUserQuery as jest.Mock).mockReturnValue({
      data: { roles: [Roles.USER] },
    })
    ;(useAccessibleCustomServices as jest.Mock).mockReturnValue({
      services: ALL_SERVICES,
    })
    ;(useGetDomainTypeTemplatesQuery as jest.Mock).mockReturnValue({
      data: [],
    })
  })

  // РЕГРЕСІЙНИЙ ТЕСТ: раніше пошук ішов за value (_id), а не за назвою,
  // тому введення "Вив" давало "No data", хоча "Вивіз сміття" є у списку.
  it('пошук у фільтрі знаходить послугу за назвою, а не за id', async () => {
    renderHeader()
    openDropdown()
    typeInSearch('Вив')

    expect(await screen.findByText('Вивіз сміття')).toBeInTheDocument()
    expect(screen.queryByText('Прибирання (грн)')).not.toBeInTheDocument()
    expect(screen.queryByText('Електропостачання')).not.toBeInTheDocument()
  })

  it('пошук не залежить від id: введення id послуги нічого не знаходить', async () => {
    renderHeader()
    openDropdown()
    typeInSearch('s1')

    await waitFor(() => {
      expect(screen.queryByText('Вивіз сміття')).not.toBeInTheDocument()
    })
    expect(screen.queryByText('Прибирання (грн)')).not.toBeInTheDocument()
    expect(screen.queryByText('Електропостачання')).not.toBeInTheDocument()
  })

  it('не показує жодної послуги, якщо збігів немає', async () => {
    renderHeader()
    openDropdown()
    typeInSearch('неіснуюча послуга')

    await waitFor(() => {
      expect(screen.queryByText('Вивіз сміття')).not.toBeInTheDocument()
    })
    expect(screen.queryByText('Прибирання (грн)')).not.toBeInTheDocument()
    expect(screen.queryByText('Електропостачання')).not.toBeInTheDocument()
  })

  it('вибір однієї послуги викликає setFilters з її id і зберігає інші фільтри', async () => {
    const { setFilters } = renderHeader()
    openDropdown()
    fireEvent.click(await screen.findByText('Вивіз сміття'))

    expect(setFilters).toHaveBeenCalledTimes(1)
    const updater = setFilters.mock.calls[0][0]
    expect(updater({ domain: ['d1'] })).toEqual({
      domain: ['d1'],
      services: ['s1'],
    })
  })

  it('вибір кількох послуг передає всі id', () => {
    const { setFilters } = renderHeader({
      filters: { services: ['s1'] },
    })
    openDropdown()
    fireEvent.click(screen.getByText('Електропостачання'))

    const updater = setFilters.mock.calls[0][0]
    expect(updater({ services: ['s1'] }).services).toEqual(['s1', 's3'])
  })

  it('скидання фільтра (хрестик) передає порожній масив послуг', () => {
    const { setFilters, container } = renderHeader({
      filters: { services: ['s1'] },
    })
    const clearIcon = container.querySelector('.ant-select-clear')
    expect(clearIcon).not.toBeNull()
    fireEvent.mouseDown(clearIcon as Element)

    const updater = setFilters.mock.calls[0][0]
    expect(updater({ services: ['s1'], domain: ['d1'] })).toEqual({
      services: [],
      domain: ['d1'],
    })
  })

  it('користувач бачить лише послуги, налаштовані на домені його компаній', () => {
    renderHeader({ realEstates: makeRealEstates('d1', ['s1']) })
    openDropdown()

    expect(screen.getByText('Вивіз сміття')).toBeInTheDocument()
    expect(screen.queryByText('Прибирання (грн)')).not.toBeInTheDocument()
    expect(screen.queryByText('Електропостачання')).not.toBeInTheDocument()
  })

  it('при зміні домену список доступних послуг оновлюється', () => {
    const { rerender } = renderHeader({
      realEstates: makeRealEstates('d1', ['s1']),
    })
    openDropdown()
    expect(screen.getByText('Вивіз сміття')).toBeInTheDocument()

    rerender(
      <CompaniesHeader
        filters={{}}
        setFilters={jest.fn()}
        realEstates={makeRealEstates('d2', ['s2'])}
        realEstateActions={{ edit: false }}
        setRealEstateActions={jest.fn()}
      />
    )

    expect(screen.queryByText('Вивіз сміття')).not.toBeInTheDocument()
    expect(screen.getByText('Прибирання (грн)')).toBeInTheDocument()
  })

  it('послуги, виключені з домену, не показуються серед доступних', () => {
    renderHeader({ realEstates: makeRealEstates('d1', ['s2', 's3']) })
    openDropdown()

    expect(screen.queryByText('Вивіз сміття')).not.toBeInTheDocument()
    expect(screen.getByText('Прибирання (грн)')).toBeInTheDocument()
    expect(screen.getByText('Електропостачання')).toBeInTheDocument()
  })
})
