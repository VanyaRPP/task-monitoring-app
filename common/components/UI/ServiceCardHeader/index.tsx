import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import React, { FC, useState } from 'react'
import { AppRoutes } from '@utils/constants'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import AddServiceModal from '@common/components/AddServiceModal'
import s from './style.module.scss'

const ServiceCardHeader = ({ setCurrentService, currentService }) => {
  const Router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentService(null)
  }

  return (
    <div className={s.tableHeader}>
      <Button type="link" onClick={() => Router.push(AppRoutes.SERVICE)}>
        Послуги
        <SelectOutlined className={s.Icon} />
      </Button>
      <Button type="link" onClick={() => setIsModalOpen(true)}>
        <PlusOutlined /> Додати
      </Button>
      {(isModalOpen || currentService) && (
        <AddServiceModal
          currentService={currentService}
          closeModal={closeModal}
        />
      )}
    </div>
  )
}

export default ServiceCardHeader
