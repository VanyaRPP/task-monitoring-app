import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import React, { FC, useState } from 'react'
import { AppRoutes } from '@utils/constants'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import s from './style.module.scss'
import RealEstateModal from '../RealEstateModal'

const RealEstateCardHeader = () => {
  const Router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const closeModal = () => {
    setIsModalOpen(false)
  }

  return (
    <div className={s.tableHeader}>
      <Button type="link" onClick={() => Router.push(AppRoutes.REAL_ESTATE)}>
        Об'єкти нерухомості
        <SelectOutlined className={s.Icon} />
      </Button>
      <Button type="link" onClick={() => setIsModalOpen(true)}>
        <PlusOutlined /> Додати
      </Button>
      <RealEstateModal isModalOpen={isModalOpen} closeModal={closeModal} />
    </div>
  )
}

export default RealEstateCardHeader
