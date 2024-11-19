import { useState } from 'react'
import { Table, Button } from 'antd'
import { useRouter } from 'next/router'
import { CalendarOutlined, PlusOutlined } from '@ant-design/icons'

import { useGetCostPaymentQuery } from '@common/api/paymentApi/payment.api'
import s from './style.module.scss'
import TableCard from '@components/UI/TableCard'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { isAdminCheck } from '@utils/helpers'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import AddCostModal from '@components/AddCostModal'

// Активуємо плагін
dayjs.extend(localizedFormat)

const ProfitPayment: React.FC = () => {
  const router = useRouter()
  const { data: currUser } = useGetCurrentUserQuery()
  const isAdmin = isAdminCheck(currUser?.roles)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const closeModal = () => {
    setIsModalOpen(false)
    closeEditModal()
  }

  const closeEditModal = () => {}

  const [selectedDate, setSelectedDate] = useState<string>()

  const { data: profitPayment, isLoading, isError } = useGetCostPaymentQuery()

  const columns = [
    {
      title: 'Місяць',
      dataIndex: 'month',
      key: 'month',
      render: (value) => {
        const formattedMonth = dayjs(value).locale('uk').format('MMMM YYYY')
        return formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1)
      },
    },
    {
      title: 'Дебет',
      dataIndex: 'totalGeneralSumDebit',
      key: 'totalGeneralSumDebit',
      render: (value) => `${value.toLocaleString()} UAH`,
    },
    {
      title: 'Кредит',
      dataIndex: 'totalGeneralSumCredit',
      key: 'totalGeneralSumCredit',
      render: (value) => `${value.toLocaleString()} UAH`,
    },
  ]

  return (
    <TableCard
      title={
        <div className={s.firstBlock}>
          <Button
            type="link"
            onClick={() => {
              router.push('/profit')
            }}
          >
            <CalendarOutlined />
            Прибутки
          </Button>
          {isAdmin && (
            <Button type="link" onClick={() => setIsModalOpen(true)}>
              <PlusOutlined /> Додати
            </Button>
          )}
          {isModalOpen && <AddCostModal closeModal={closeModal} />}
        </div>
      }
    >
      <Table
        className={s.secondBlock}
        dataSource={profitPayment?.data}
        columns={columns}
        loading={isLoading}
        rowKey="month"
        pagination={false}
      />
    </TableCard>
  )
}

export default ProfitPayment
