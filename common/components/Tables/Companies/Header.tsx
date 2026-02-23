import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { Button, Space, Segmented, Select } from 'antd'
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
      <div style={{ position: 'absolute', left: 400,}}>
      <Select
        mode="multiple"
        allowClear
        placeholder="Фільтр послуг"
        style={{ width: "250px" }}
        value={filters?.services || []}
        onChange={handleServicesChange}
        maxTagCount="responsive"
      >
        <Select.Option value="totalArea">Площа (м²)</Select.Option>
        <Select.Option value="pricePerMeter">Ціна (грн/м²)</Select.Option>
        <Select.Option value="cleaning">Прибирання (грн)</Select.Option>
        <Select.Option value="waterPart">Частка водопостачання</Select.Option>
        <Select.Option value="garbageCollector">Вивіз сміття</Select.Option>
        <Select.Option value="inflicion">Нарахування інд. інф.</Select.Option>
      </Select>
    </div>  
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
              chosenRealEstate={
                filters?.domain ? { domain: filters?.domain[0] } : null
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
