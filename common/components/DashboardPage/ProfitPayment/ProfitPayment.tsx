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
  }

  const { data: profitPayment, isLoading } = useGetCostPaymentQuery()

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
      title: 'Прибутки',
      dataIndex: 'totalGeneralSumDebit',
      key: 'totalGeneralSumDebit',
      render: (value) => `${value.toLocaleString()} UAH`,
    },
    {
      title: 'Витрати',
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
        summary={(
          pageData: {
            month: string
            totalGeneralSumDebit: number
            totalGeneralSumCredit: number
          }[]
        ) => {
          let totalSumDebit = 0
          let totalSumCredit = 0
          pageData.forEach((month) => {
            totalSumDebit += month?.totalGeneralSumDebit || 0
            totalSumCredit += month?.totalGeneralSumCredit || 0
          })
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>Всього</Table.Summary.Cell>
              <Table.Summary.Cell
                index={1}
              >{`${totalSumDebit.toLocaleString()} UAH`}</Table.Summary.Cell>
              <Table.Summary.Cell
                index={1}
              >{`${totalSumCredit.toLocaleString()} UAH`}</Table.Summary.Cell>
            </Table.Summary.Row>
          )
        }}
      />
    </TableCard>
  )
}

export default ProfitPayment
