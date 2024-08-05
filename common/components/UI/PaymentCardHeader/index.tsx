import {
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  SelectOutlined,
} from '@ant-design/icons'
import { dateToDefaultFormat } from '@assets/features/formatDate'
import {
  useDeleteMultiplePaymentsMutation,
  useGeneratePdfMutation,
} from '@common/api/paymentApi/payment.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import AddPaymentModal from '@components/AddPaymentModal'
import StreetsSelector from '@components/StreetsSelector'
import ImportInvoices from '@components/UI/PaymentCardHeader/ImportInvoices'
import PaymentCascader from '@components/UI/PaymentCascader/index'
import SelectForDebitAndCredit from '@components/UI/PaymentSelect'
import FilterTags from '@components/UI/Reusable/FilterTags'
import { AppRoutes, Roles } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import { Button, Flex, Space, message } from 'antd'
import Modal from 'antd/lib/modal/Modal'
import { saveAs } from 'file-saver'
import { useRouter } from 'next/router'
import { useState } from 'react'

const PaymentCardHeader = ({
  setCurrentDateFilter,
  setCurrentTypeOperation,
  currentPayment,
  paymentActions,
  closeEditModal,
  paymentsDeleteItems,
  payments,
  streets,
  filters,
  setFilters,
  selectedPayments,
  setPaymentsDeleteItems,
  setSelectedPayments,
}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: currUser } = useGetCurrentUserQuery()

  const { pathname } = router

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
          setPaymentsDeleteItems([])
          setSelectedPayments([])
          message.success('Видалено!')
        } else {
          message.error('Помилка при видаленні рахунків')
        }
      },
    })
  }

  const [generatePdf] = useGeneratePdfMutation()

  const handleGeneratePdf = async () => {
    try {
      const response = await generatePdf({
        payments: selectedPayments,
      })

      if ('data' in response) {
        const { data } = response

        if (data) {
          const buffer = Buffer.from(data.buffer)
          const blob = new Blob([buffer], {
            type: `application/${data.fileExtension}`,
          })

          saveAs(blob, `${data.fileName}.${data.fileExtension}`)
        }
      } else {
        message.error('Сталася помилка під час генерації PDF')
      }
    } catch (error) {
      message.error('Сталася несподівана помилка під час генерації PDF')
    }
  }

  if (!isAdmin && currUser) {
    return (
      <Button type="link" onClick={() => router.push(AppRoutes.PAYMENT)}>
        Мої оплати
        <SelectOutlined />
      </Button>
    )
  }

  if (isAdmin) {
    return (
      <Flex justify="space-between">
        <Space>
          <Button type="link" onClick={() => router.push(AppRoutes.PAYMENT)}>
            Платежі
            <SelectOutlined />
          </Button>
          {location.pathname === AppRoutes.PAYMENT && (
            <Space>
              <PaymentCascader onChange={setCurrentDateFilter} />
              <SelectForDebitAndCredit onChange={setCurrentTypeOperation} />
              <StreetsSelector
                filters={filters}
                setFilters={setFilters}
                streets={streets}
              />
              <FilterTags
                filters={filters}
                setFilters={setFilters}
                collection={payments}
              />
            </Space>
          )}
        </Space>
        <Flex wrap align="center" justify="flex-end">
          <ImportInvoices />
          <Button
            type="link"
            onClick={() => router.push(AppRoutes.PAYMENT_BULK)}
          >
            Інвойси <SelectOutlined />
          </Button>
          <Button type="link" onClick={() => setIsModalOpen(true)}>
            <PlusOutlined /> Додати
          </Button>
          {(isModalOpen || currentPayment) && (
            <AddPaymentModal
              paymentActions={paymentActions}
              paymentData={currentPayment}
              closeModal={closeModal}
            />
          )}
          {isAdmin &&
            pathname === AppRoutes.PAYMENT &&
            selectedPayments.length > 0 && (
              <Button type="link" onClick={() => handleGeneratePdf()}>
                Завантажити рахунки <DownloadOutlined />
              </Button>
            )}
          {isGlobalAdmin &&
            pathname === AppRoutes.PAYMENT &&
            selectedPayments.length > 0 && (
              <Button type="link" onClick={() => handleDeletePayments()}>
                <DeleteOutlined /> Видалити
              </Button>
            )}
        </Flex>
      </Flex>
    )
  }
}

export default PaymentCardHeader
