import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { AppRoutes } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'
import RealEstateModal from '../RealEstateModal'
import s from './style.module.scss'

const RealEstateCardHeader = () => {
  const Router = useRouter()
  const { data: user } = useGetCurrentUserQuery()

  const [isModalOpen, setIsModalOpen] = useState(false)

  const closeModal = () => {
    setIsModalOpen(false)
  }

  return (
    <div className={s.tableHeader}>
      <Button type="link" onClick={() => Router.push(AppRoutes.REAL_ESTATE)}>
        Компанії
        <SelectOutlined className={s.Icon} />
      </Button>

      {isAdminCheck(user?.roles) && (
        <Button type="link" onClick={() => setIsModalOpen(true)}>
          <PlusOutlined /> Додати
        </Button>
      )}
      {isModalOpen && <RealEstateModal closeModal={closeModal} />}
    </div>
  )
}

export default RealEstateCardHeader
