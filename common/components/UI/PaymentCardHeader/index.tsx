import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import React, { useState } from 'react'
import { AppRoutes } from '@utils/constants'
import { Button, Tag } from 'antd'
import { useRouter } from 'next/router'
import AddPaymentModal from '@common/components/AddPaymentModal'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import s from './style.module.scss'
import { isAdminCheck } from '@utils/helpers'
import PaymentCascader from '@common/components/UI/PaymentCascader/index'
import PaymentsFilterTags from './PaymentsFilterTags'
import ImportInvoices from './ImportInvoices'

const PaymentCardHeader = ({
  setCurrentDateFilter,
  currentPayment,
  paymentActions,
  closeEditModal,
  payments,
  filters,
  setFilters,
}) => {
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
              <div className={s.firstBlock}>
                <Button
                  type="link"
                  onClick={() => router.push(AppRoutes.PAYMENT)}
                >
                  Проплати
                  <SelectOutlined className={s.Icon} />
                </Button>
                {location.pathname === AppRoutes.PAYMENT && (
                  <>
                    <PaymentCascader onChange={setCurrentDateFilter} />
                    <PaymentsFilterTags
                      filters={filters}
                      setFilters={setFilters}
                      payments={payments}
                    />
                  </>
                )}
              </div>
            )}
            <div>
              <ImportInvoices />
              <Button
                type="link"
                onClick={() => router.push(AppRoutes.PAYMENT_BULK)}
              >
                Інвойси <SelectOutlined className={s.Icon} />
              </Button>
              <Button type="link" onClick={() => setIsModalOpen(true)}>
                <PlusOutlined /> Додати
              </Button>
            </div>
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
          paymentActions={paymentActions}
          paymentData={currentPayment}
          closeModal={closeModal}
        />
      )}
    </>
  )
}

export default PaymentCardHeader
