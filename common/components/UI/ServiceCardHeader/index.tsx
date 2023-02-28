import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import React, { FC, useState } from 'react'
import { AppRoutes } from '@utils/constants'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import AddServiceModal from '@common/components/AddServiceModal'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from 'common/api/userApi/user.api'
import { Roles } from '@utils/constants'
import s from './style.module.scss'

const ServiceCardHeader = () => {
  const Router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const { data: session } = useSession()
  const { data } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = data?.data

  return (
    <div className={s.TableHeader}>
      {'Послуги'}
      {user?.role === Roles.ADMIN && (
        <Button type="link" onClick={() => setIsModalOpen(true)}>
          <PlusOutlined /> Додати
        </Button>
      )}
      <AddServiceModal isModalOpen={isModalOpen} closeModal={closeModal} />
    </div>
  )
}

export default ServiceCardHeader
