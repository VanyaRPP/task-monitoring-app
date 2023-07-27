import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import React, { useState } from 'react'
import { AppRoutes } from '@utils/constants'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import AddPaymentModal from '@common/components/AddPaymentModal'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import s from './style.module.scss'
import { isAdminCheck } from '@utils/helpers'
import CustomCascader from '@common/components/UI/PaymentCascader/index'

const PaymentCardHeader = ({ currentPayment, closeEditModal, customOptions, handleChange}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: currUser } = useGetCurrentUserQuery()

  const {
    query: { email },
  } = router

  const closeModal = () => {
    setIsModalOpen(false)
    closeEditModal()
  }

  const isAdmin = isAdminCheck(currUser?.roles)

  return (
    <>
      <div className={s.tableHeader}>
        {isAdmin ? (
          <>
            {email ? (
              <span
                className={s.title}
              >{`Оплата від користувача ${email}`}</span>
            ) : (
             <>
              <Button type="link" onClick={() => router.push(AppRoutes.PAYMENT)}>
                Проплати
                <SelectOutlined className={s.Icon} />
              </Button>
              <CustomCascader options={customOptions} onChange={handleChange} 
    />
            </>
          )}
            <Button type="link" onClick={() => setIsModalOpen(true)}>
              <PlusOutlined /> Додати
            </Button>
          </>
        ) : (
          currUser && (
            <Button
              className={s.myPayments}
              type="link"
              onClick={() => router.push(AppRoutes.PAYMENT)}
            >
              Мої оплати
              <SelectOutlined className={s.Icon} />
            </Button>
          )
        )}
      </div>
      {(isModalOpen || currentPayment) && (
        <AddPaymentModal
          edit={!!currentPayment}
          paymentData={currentPayment}
          closeModal={closeModal}
        />
      )}
    </>
  )
}

export default PaymentCardHeader
