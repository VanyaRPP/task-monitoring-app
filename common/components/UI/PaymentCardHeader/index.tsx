import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import React, { FC, useState } from 'react'
import { AppRoutes } from '@utils/constants'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import AddPaymentModal from '@common/components/AddPaymentModal'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from 'common/api/userApi/user.api'
import { Roles } from '@utils/constants'
import s from './style.module.scss'

const PaymentCardHeader = () => {
  const Router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const { data: session } = useSession()
  const { data } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const isAdmin = data?.data.role === Roles.ADMIN

  return (
    <div className={s.tableHeader}>
      {isAdmin ? (
        <Button type="link" onClick={() => Router.push(AppRoutes.PAYMENT)}>
          Проплати
          <SelectOutlined className={s.Icon} />
        </Button>
      ) : (
        <span className={s.userTitle}>Мої проплати</span>
      )}
      {isAdmin && (
        <Button type="link" onClick={() => setIsModalOpen(true)}>
          <PlusOutlined /> Додати оплату
        </Button>
      )}
      <AddPaymentModal isModalOpen={isModalOpen} closeModal={closeModal} />
    </div>
  )
}

export default PaymentCardHeader
