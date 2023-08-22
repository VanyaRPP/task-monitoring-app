import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import AddServiceModal from '@common/components/AddServiceModal'
import { AppRoutes } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import { IExtendedService } from '@common/api/serviceApi/service.api.types'

export interface Props {
  showAddButton?: boolean
  currentService?: IExtendedService
  setCurrentService?: (service: IExtendedService) => void
}

const ServicesHeader: React.FC<Props> = ({
  showAddButton = false,
  currentService,
  setCurrentService,
}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: user } = useGetCurrentUserQuery()

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentService(null)
  }

  if (router.query.email)
    return <span>Оплата від користувача {router.query.email}</span>

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Button type="link" onClick={() => router.push(AppRoutes.SERVICE)}>
        Послуги <SelectOutlined />
      </Button>

      {showAddButton && isAdminCheck(user?.roles) && (
        <>
          <Button type="link" onClick={openModal}>
            <PlusOutlined /> Додати
          </Button>
          {(isModalOpen || currentService) && (
            <AddServiceModal
              currentService={currentService}
              closeModal={closeModal}
            />
          )}
        </>
      )}
    </div>
  )
}

export default ServicesHeader
