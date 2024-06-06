import { DeleteOutlined, PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { useDeleteMultiplePaymentsMutation } from '@common/api/paymentApi/payment.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { dateToDefaultFormat } from '@common/assets/features/formatDate'
import AddPaymentModal from '@common/components/AddPaymentModal'
import { AppRoutes, Roles } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import { Button, message } from 'antd'
import Modal from 'antd/lib/modal/Modal'
import { useRouter } from 'next/router'
import { useState } from 'react'
import FilterTags from '../Reusable/FilterTags'
import ImportInvoices from './ImportInvoices'
import s from './style.module.scss'

const PaymentCardHeader = ({
  currentPayment,
  paymentActions,
  closeEditModal,
  paymentsDeleteItems,
  payments,
  filters,
  setFilters,
}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: currUser } = useGetCurrentUserQuery()

  const {
    pathname,
    query: { email },
  } = router

  const closeModal = () => {
    setIsModalOpen(false)
    closeEditModal()
  }

  const isGlobalAdmin = currUser?.roles?.includes(Roles.GLOBAL_ADMIN)
  const isAdmin = isAdminCheck(currUser?.roles)
  const [deletePayment] = useDeleteMultiplePaymentsMutation()

  const handleDeletePayments = async () => {
    ;(Modal as any).confirm({
      title: 'Ви впевнені, що хочете видалити обрані проплати?',
      cancelText: 'Ні',
      okText: 'Так',
      content: (
        <>
          {paymentsDeleteItems.map((item, index) => (
            <div key={index}>
              {index + 1}. {item.domain}, {item.company},{' '}
              {dateToDefaultFormat(item.date)}
            </div>
          ))}
        </>
      ),
      onOk: async () => {
        const response = await deletePayment(
          paymentsDeleteItems.map((item) => item.id)
        )
        if ('data' in response) {
          message.success('Видалено!')
        } else {
          message.error('Помилка при видаленні рахунків')
        }
      },
    })
  }

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
                  Платежі
                  <SelectOutlined className={s.Icon} />
                </Button>
                {location.pathname === AppRoutes.PAYMENT && (
                  <>
                    <FilterTags
                      filters={filters}
                      setFilters={setFilters}
                      collection={payments}
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
              {isGlobalAdmin && pathname === AppRoutes.PAYMENT && (
                <Button
                  type="link"
                  onClick={() => handleDeletePayments()}
                  disabled={paymentsDeleteItems.length == 0}
                >
                  <DeleteOutlined /> Видалити
                </Button>
              )}
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
