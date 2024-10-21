import { PlusOutlined } from '@ant-design/icons'
import { Button, Space, Segmented } from 'antd'
import { useRouter } from 'next/router'
import { Dispatch, SetStateAction, useState } from 'react'
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

export interface Props {
  showAddButton?: boolean
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
  const handleArchiveToggle = (value: boolean) => {
    setIsArchive(value)
  }

  const { data: realEstate } = useGetRealEstateFiltersQuery()
  const { data: domain } = useGetDomainFiltersQuery()

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
        </Button>

        {router.pathname === AppRoutes.REAL_ESTATE && isAdmin && (
          <Space direction="vertical" size={4} style={{ minWidth: 300 }}>
            <DomainFilterTags
              collection={domain?.domainsFilter}
              filters={filters}
              setFilters={setFilters}
            />
            <CompanyFilterTags
              collection={realEstate?.realEstatesFilter}
              filters={filters}
              setFilters={setFilters}
            />
          </Space>
        )}
      </div>

      <div className={s.segmented}>
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
