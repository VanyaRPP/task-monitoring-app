import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import React, { FC, useState } from 'react'
import { AppRoutes } from '@utils/constants'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import AddFavorModal from '@common/components/AddFavorModal'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from 'common/api/userApi/user.api'
import { Roles } from '@utils/constants'
import s from './style.module.scss'

const FavorCardHeader = () => {
  const Router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const { data: session } = useSession()
  const { data } = useGetUserByEmailQuery(`${session?.user?.email}`, {
    skip: !session?.user?.email,
  })
  const isAdmin = data?.data.role === Roles.ADMIN

  return (
    <div className={s.tableHeader}>
      {'Послуги'}
      <Button type="link" onClick={() => setIsModalOpen(true)}>
        <PlusOutlined /> Додати
      </Button>
      <AddFavorModal isModalOpen={isModalOpen} closeModal={closeModal} />
    </div>
  )
}

export default FavorCardHeader
