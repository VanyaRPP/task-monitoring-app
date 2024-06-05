import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'

import {
  IGetRealestateResponse,
  IRealEstate,
} from '@common/api/realestateApi/realestate.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import RealEstateModal from '@common/components/UI/RealEstateComponents/RealEstateModal'
import CompanyFilterSelector from '@common/components/UI/Reusable/FilterSelectors/CompanyFilterSelector'
import DomainFilterSelector from '@common/components/UI/Reusable/FilterSelectors/DomainFilterSelecter'
import StreetFilterSelector from '@common/components/UI/Reusable/FilterSelectors/StreetFilterSelector'
import FilterTags from '@common/components/UI/Reusable/FilterTags'
import { AppRoutes } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import s from './style.module.scss'

export interface Props {
  showAddButton?: boolean
  currentRealEstate?: IRealEstate
  setCurrentRealEstate?: (realEstate: IRealEstate) => void
  filters?: any
  setFilters?: (filters: any) => void
  realEstates?: IGetRealestateResponse
}

const CompaniesHeader: React.FC<Props> = ({
  showAddButton = false,
  currentRealEstate,
  setCurrentRealEstate,
  filters,
  setFilters,
  realEstates,
}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: user } = useGetCurrentUserQuery()
  const isAdmin = isAdminCheck(user?.roles)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentRealEstate(null)
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
            />
          )}
        </>
      )}
    </div>
  )
}

export default CompaniesHeader
