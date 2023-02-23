import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import React, { FC, useState } from 'react'
import { AppRoutes } from '@utils/constants'
import { Button, Card } from 'antd'
import { useRouter } from 'next/router'
import AddPaymentModal from '@common/components/AddPaymentModal'
import s from './style.module.scss'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from 'common/api/userApi/user.api'
import { Roles } from '@utils/constants'

const PaymentCardHeader = () => {
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
      <Button type="link" onClick={() => Router.push(AppRoutes.PAYMENT)}>
        Проплати
        <SelectOutlined className={s.Icon} />
      </Button>

      <Card onClick={(e) => e.stopPropagation()} className={s.Card}>
        {user?.role === Roles.ADMIN && (
          <Button type="link" onClick={() => setIsModalOpen(true)}>
            <PlusOutlined /> Додати оплату
          </Button>
        )}
      </Card>
      <AddPaymentModal isModalOpen={isModalOpen} closeModal={closeModal} />
    </div>
  )
}

export default PaymentCardHeader
