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
import { useTranslation } from 'react-i18next'


// Активуємо плагін
dayjs.extend(localizedFormat)

const ProfitPayment: React.FC = () => {
  const { t } = useTranslation('profitPayment')
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

  const { data: profitPayment, isLoading } = useGetCostPaymentQuery()

  const columns = [
    {
      title: t('table.month'),
      dataIndex: 'month',
      key: 'month',
      render: (value) => {
        const formattedMonth = dayjs(value).locale('uk').format('MMMM YYYY')
        return formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1)
      },
    },
    {
      title: t('table.income'),
      dataIndex: 'totalGeneralSumDebit',
      key: 'totalGeneralSumDebit',
      render: (value) => `${value.toLocaleString()} UAH`,
    },
    {
      title: t('table.expenses'),
      dataIndex: 'totalGeneralSumCredit',
      key: 'totalGeneralSumCredit',
      render: (value) => `${value.toLocaleString()} UAH`,
    },
  ]

  return (
    <TableCard
      title={
        <div className={s.firstBlock}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Button type="link" onClick={() => router.push('/profit')}>
            <CalendarOutlined />
            {t('table.backToProfit')}
          </Button>
          {isAdmin && (
            <Button type="link" onClick={() => setIsModalOpen(true)}>
              <PlusOutlined /> {t('table.add')}
            </Button>
          )}
      </div>
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
              <Table.Summary.Cell index={0}>
                {t('table.total')}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                {`${totalSumDebit.toLocaleString()} UAH`}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                {`${totalSumCredit.toLocaleString()} UAH`}
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )
        }}
      />
    </TableCard>
  )
}

export default ProfitPayment