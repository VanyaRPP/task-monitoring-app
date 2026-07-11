import { PlusOutlined, SelectOutlined, DeleteOutlined } from '@ant-design/icons'
import { Button, Select, Space } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { IService } from '@common/api/serviceApi/service.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import AddServiceModal from '@components/AddServiceModal'
import {
  CompanyFilterTags,
  DomainFilterTags,
  StreetFilterTags,
} from '@components/UI/Reusable/FilterTags'
import { AppRoutes } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import s from './style.module.scss'
import React from 'react'

export interface Props {
  showAddButton?: boolean
  currentService?: IService | null
  setCurrentService?: (service: IService | null) => void
  serviceActions?: { edit: boolean; preview: boolean }
  setServiceActions: React.Dispatch<
    React.SetStateAction<{ edit: boolean; preview: boolean }>
  >
  filter?: any
  setFilter?: (filters: any) => void
  services?: any
  enableServiceButton?: boolean
  handleDeleteServices?: () => void
  selectedServices: IService[]
  user: any
  domainsFilter: any
  streetsFilter: any
  companiesFilter?: any
}

const ServicesHeader: React.FC<Props> = ({
  showAddButton = false,
  currentService,
  setCurrentService,
  serviceActions,
  setServiceActions,
  filter,
  setFilter,
  enableServiceButton = false,
  handleDeleteServices,
  selectedServices,
  user,
  domainsFilter,
  streetsFilter,
  companiesFilter,
}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentService?.(null)
    setServiceActions({ edit: false, preview: false })
  }

  if (router.query.email)
    return <span>Оплата від користувача {router.query.email}</span>

  const handleCompanyChange = (values: string[]) => {
    setFilter?.({ ...filter, company: values })
  }

  const isOnServicePage = router.pathname === AppRoutes.SERVICE

  return (
    <div className={s.headerBlock}>
      <div className={s.firstBlock}>
        <Button
          type="link"
          onClick={() => {
            if (enableServiceButton) router.push(AppRoutes.SERVICE)
          }}
        >
          Послуги <SelectOutlined />
        </Button>

        {isOnServicePage && (
          <Select
            className={s.companySelect}
            mode="multiple"
            allowClear
            placeholder="Фільтр за компанією"
            value={filter?.company || []}
            onChange={handleCompanyChange}
            maxTagCount="responsive"
            options={companiesFilter?.realEstatesFilter?.map((c) => ({
              label: c.text,
              value: c.value,
            }))}
          />
        )}

        {isOnServicePage && (
          <Space direction="vertical" size={4}>
            <DomainFilterTags
              collection={domainsFilter?.domainsFilter}
              filters={filter}
              setFilters={setFilter}
            />
            <CompanyFilterTags
              collection={companiesFilter?.realEstatesFilter}
              filters={filter}
              setFilters={setFilter}
            />
            <StreetFilterTags
              collection={streetsFilter?.streetsFilter}
              filters={filter}
              setFilters={setFilter}
            />
          </Space>
        )}
      </div>
      <div className={s.secondBlock}>
        {isAdminCheck(user?.roles) &&
          isOnServicePage &&
          selectedServices.length > 0 && (
            <Button type="link" onClick={() => handleDeleteServices?.()}>
              <DeleteOutlined /> Видалити
            </Button>
          )}
        {showAddButton && isAdminCheck(user?.roles) && (
          <Button className={s.addButton} type="link" onClick={openModal}>
            <PlusOutlined /> Додати
          </Button>
        )}
        {(isModalOpen || currentService) && (
          <AddServiceModal
            currentService={currentService ?? null}
            closeModal={closeModal}
            serviceActions={serviceActions}
          />
        )}
      </div>
    </div>
  )
}

export default React.memo(ServicesHeader)
