import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import AddServiceModal from '@common/components/AddServiceModal'
import { AppRoutes } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import { IExtendedService } from '@common/api/serviceApi/service.api.types'
import AddressesFilterTags from '@common/components/UI/Reusable/AddressesFilterTags'
import s from './style.module.scss'

export interface Props {
  showAddButton?: boolean
  currentService?: IExtendedService
  setCurrentService?: (service: IExtendedService) => void
  serviceActions?: {
    edit: boolean
    preview: boolean
  },
  setServiceActions: React.Dispatch<
    React.SetStateAction<{
      edit: boolean
      preview: boolean
    }>
  >,
  filter?: any
  setFilter?: (filters: any) => void
  services?: any
}

const ServicesHeader: React.FC<Props> = ({
  showAddButton = false,
  currentService,
  setCurrentService,
  serviceActions,
  setServiceActions,
  filter,
  setFilter,
  services,
}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: user } = useGetCurrentUserQuery()

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentService(null)
    setServiceActions({
      edit: false,
      preview: false,
    })
  }

  if (router.query.email)
    return <span>Оплата від користувача {router.query.email}</span>

  return (
    <div className={s.headerBlock}>
      <div className={s.firstBlock}>
        <Button type="link" onClick={() => router.push(AppRoutes.SERVICE)}>
          Послуги <SelectOutlined />
        </Button>

        {router.pathname === AppRoutes.SERVICE && (
          <>
            <AddressesFilterTags
              filter={filter}
              setFilters={setFilter}
              collection={services}
            />
          </>
        )}
      </div>
      {showAddButton && isAdminCheck(user?.roles) && (
        <>
          <Button type="link" onClick={openModal}>
            <PlusOutlined /> Додати
          </Button>
        </>
      )}
      {(isModalOpen || currentService) && (
        <AddServiceModal
          currentService={currentService}
          closeModal={closeModal}
          serviceActions={serviceActions}
        />
      )}
    </div>
  )
}

export default ServicesHeader
