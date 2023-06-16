import React, { useState } from 'react'
import s from './style.module.scss'
import { Button } from 'antd'
import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { AppRoutes } from '@utils/constants'
import { useRouter } from 'next/router'
import DomainModal from '../DomainModal'

const DomainStreetsComponent = ({ data }) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const closeModal = () => {
    setIsModalOpen(false)
  }
  return (
    <div className={s.tableHeader}>
      <Button type="link" onClick={() => router.push(AppRoutes.DOMAIN)}>
        Домени
        <SelectOutlined className={s.Icon} />
      </Button>

      <Button type="link" onClick={() => setIsModalOpen(true)}>
        <PlusOutlined /> Додати
      </Button>
      <DomainModal isModalOpen={isModalOpen} closeModal={closeModal} />
    </div>
  )
}
export default DomainStreetsComponent
