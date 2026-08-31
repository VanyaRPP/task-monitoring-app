import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { Button, Space, Segmented, Select } from 'antd'
import { useRouter } from 'next/router'
import { Dispatch, SetStateAction, useState, useMemo } from 'react'
import {
  IExtendedRealestate,
  IGetRealestateResponse,
} from '@common/api/realestateApi/realestate.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import RealEstateModal from '@components/UI/RealEstateComponents/RealEstateModal'
import {
  CompanyFilterTags,
  DomainFilterTags,
} from '@components/UI/Reusable/FilterTags'
import { AppRoutes } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import s from './style.module.scss'
import {
  useGetDomainFiltersQuery,
  useGetRealEstateFiltersQuery,
} from '@common/api/filterApi/filter.api'
import { useAccessibleCustomServices } from '@common/api/customServicesApi/useAccessibleCustomServices'
import { useGetDomainTypeTemplatesQuery } from '@common/api/domainApi/domain.api'
import {
  extractDomainsFromRealEstates,
  getSelectedServiceIds,
  getVisibleServices,
  isGlobalAdmin,
  shouldShowStandardServices,
} from '@utils/servicesVisibility'

export interface Props {
  showAddButton?: boolean
  isSingleCompanyByData?: boolean
  currentRealEstate?: IExtendedRealestate
  setCurrentRealEstate?: (realEstate: IExtendedRealestate) => void
  filters?: any
  setFilters?: (filters: any) => void
  setIsArchive?: Dispatch<SetStateAction<boolean>>
  realEstates?: IGetRealestateResponse
  setRealEstateActions: React.Dispatch<
    React.SetStateAction<{
      edit: boolean
    }>
  >
  realEstateActions: {
    edit: boolean
  }
  enableRealEstateButton?: true | false
}

const CompaniesHeader: React.FC<Props> = ({
  showAddButton = false,
  currentRealEstate,
  setCurrentRealEstate,
  filters,
  setFilters,
  setRealEstateActions,
  realEstateActions,
  enableRealEstateButton,
  setIsArchive,
  isSingleCompanyByData,
  realEstates,
}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Backend-scoped to the caller's domains; the memo below only narrows it
  // presentationally to the domains currently visible on screen.
  const { services: allCustomServices } = useAccessibleCustomServices()

  const { data: user } = useGetCurrentUserQuery()
  const isAdmin = isAdminCheck(user?.roles)

  const visibleDomains = useMemo(
    () => extractDomainsFromRealEstates(realEstates?.data),
    [realEstates?.data]
  )
  const { data: domainTypeTemplates = [] } = useGetDomainTypeTemplatesQuery()
  const showStandardServices = useMemo(
    () => shouldShowStandardServices(visibleDomains, domainTypeTemplates),
    [visibleDomains, domainTypeTemplates]
  )
  const hasActiveFilters = !!(
    filters?.domain?.length || filters?.company?.length
  )

  const customServices = useMemo(() => {
    if (isGlobalAdmin(user?.roles) && hasActiveFilters) {
      const selectedIds = getSelectedServiceIds(visibleDomains)
      if (!selectedIds.length) return []
      const selectedSet = new Set(selectedIds)
      return allCustomServices.filter((s) => selectedSet.has(s._id))
    }
    return getVisibleServices(user?.roles, visibleDomains, allCustomServices)
  }, [user?.roles, visibleDomains, allCustomServices, hasActiveFilters])

  const openModal = () => {
    setIsModalOpen(true)
    setCurrentRealEstate(null)
    setRealEstateActions({ edit: true })
  }
  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentRealEstate(null)
    setRealEstateActions({ edit: false })
  }
  const handleArchiveToggle = (value: boolean) => {
    setIsArchive(value)
  }

  const { data: realEstateData } = useGetRealEstateFiltersQuery({
    streets: filters?.street,
    domains: filters?.domain,
  })
  const { data: domainData } = useGetDomainFiltersQuery({
    streets: filters?.street,
    realEstates: filters?.company,
  })

  const handleServicesChange = (values: string[]) => {
    setFilters((prev: any) => ({
      ...prev,
      services: values,
    }))
  }

  return (
    <div className={s.headerBlock}>
      <div className={s.firstBlock}>
        <Button
          type="link"
          onClick={() => {
            if (enableRealEstateButton) {
              router.push(AppRoutes.REAL_ESTATE)
            }
          }}
        >
          Компанії
          <SelectOutlined />
        </Button>

        {router.pathname === AppRoutes.REAL_ESTATE && isAdmin && (
          <Space direction="vertical" size={4} style={{ minWidth: 300 }}>
            <DomainFilterTags
              collection={domainData?.domainsFilter}
              filters={filters}
              setFilters={setFilters}
            />

            <CompanyFilterTags
              collection={realEstateData?.realEstatesFilter}
              filters={filters}
              setFilters={setFilters}
            />
          </Space>
        )}
      </div>

      <div className={s.segmented}>
        <Select
          mode="multiple"
          allowClear
          placeholder="Фільтр послуг"
          style={{ width: '250px', minWidth: '150px' }}
          value={filters?.services || []}
          onChange={handleServicesChange}
          maxTagCount="responsive"
        >
          {customServices.length > 0 && (
            <Select.OptGroup label="Кастомні">
              {customServices.map((service) => (
                <Select.Option key={service._id} value={service._id}>
                  {service.name}
                </Select.Option>
              ))}
            </Select.OptGroup>
          )}
        </Select>

        <Segmented
          options={[
            { label: 'Неархівовані', value: false },
            { label: 'Архівовані', value: true },
          ]}
          onChange={handleArchiveToggle}
        />
      </div>

      {showAddButton && isAdmin && (
        <>
          <Button type="link" onClick={openModal} className={s.addButton}>
            <PlusOutlined /> Додати
          </Button>
          {(isModalOpen || currentRealEstate) && (
            <RealEstateModal
              closeModal={closeModal}
              chosenRealEstate={
                filters?.domain?.length === 1
                  ? { domain: filters?.domain[0] }
                  : null
              }
              currentRealEstate={currentRealEstate}
              editable={realEstateActions.edit}
            />
          )}
        </>
      )}
    </div>
  )
}

export default CompaniesHeader
