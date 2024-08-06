import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'

import {
  IExtendedRealestate,
  IGetRealestateResponse,
} from '@common/api/realestateApi/realestate.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import RealEstateModal from '@components/UI/RealEstateComponents/RealEstateModal'
import CompanyFilterSelector from '@components/UI/Reusable/FilterSelectors/CompanyFilterSelector'
import DomainFilterSelector from '@components/UI/Reusable/FilterSelectors/DomainFilterSelecter'
import StreetFilterSelector from '@components/UI/Reusable/FilterSelectors/StreetFilterSelector'
import FilterTags from '@components/UI/Reusable/FilterTags'
import { AppRoutes } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import s from './style.module.scss'

export interface Props {
  showAddButton?: boolean
  currentRealEstate?: IExtendedRealestate
  setCurrentRealEstate?: (realEstate: IExtendedRealestate) => void
  filters?: any
  setFilters?: (filters: any) => void
  realEstates?: IGetRealestateResponse
  setRealEstateActions: React.Dispatch<
    React.SetStateAction<{
      edit: boolean
    }>
  >
  realEstateActions: {
    edit: boolean
  }
}

const CompaniesHeader: React.FC<Props> = ({
  showAddButton = false,
  currentRealEstate,
  setCurrentRealEstate,
  filters,
  setFilters,
  realEstates,
  setRealEstateActions,
  realEstateActions,
}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: user } = useGetCurrentUserQuery()
  const isAdmin = isAdminCheck(user?.roles)

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

  return (
    <div className={s.headerBlock}>
      <div className={s.firstBlock}>
        <Button type="link" onClick={() => router.push(AppRoutes.REAL_ESTATE)}>
          Компанії
          <SelectOutlined />
        </Button>

        {router.pathname === AppRoutes.REAL_ESTATE && isAdmin && (
          <>
            <DomainFilterSelector
              filters={filters}
              setFilters={setFilters}
              domainsFilter={realEstates?.domainsFilter}
            />
            <StreetFilterSelector
              style={{ marginLeft: '1rem' }}
              filters={filters}
              setFilters={setFilters}
              streetsFilter={realEstates?.streetsFilter}
            />
            <CompanyFilterSelector
              style={{ marginLeft: '1rem' }}
              filters={filters}
              setFilters={setFilters}
              companiesFilter={realEstates?.realEstatesFilter}
            />
            <FilterTags
              filters={filters}
              setFilters={setFilters}
              collection={realEstates}
            />
          </>
        )}
      </div>

      {showAddButton && isAdmin && (
        <>
          <Button type="link" onClick={openModal}>
            <PlusOutlined /> Додати
          </Button>
          {(isModalOpen || currentRealEstate) && (
            <RealEstateModal
              closeModal={closeModal}
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
