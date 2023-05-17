import React, { useState } from 'react'
import s from './style.module.scss'
import { Button } from 'antd'
import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { AppRoutes, Roles } from '@utils/constants'
import { useRouter } from 'next/router'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import AddStreetModal from '@common/components/AddStreetModal'

const StreetsCardHeader = ({ data }) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: currUser } = useGetCurrentUserQuery()
  const isAdmin = currUser?.role === Roles.ADMIN

  const {
    pathname,
    query: { email },
  } = router

  return (
    <>
      <div className={s.tableHeader}>
        <Button
          type="link"
          onClick={() => {
            router.push(AppRoutes.STREETS)
          }}
        >
          Вулиці
          <SelectOutlined className={s.Icon} />
        </Button>

        {isAdmin && (
          <Button type="link" onClick={() => setIsModalOpen(true)}>
            <PlusOutlined /> Додати
          </Button>
        )}
      </div>
      {isModalOpen && (
        <AddStreetModal closeModal={() => setIsModalOpen(false)} />
      )}
    </>
  )
}
export default StreetsCardHeader
