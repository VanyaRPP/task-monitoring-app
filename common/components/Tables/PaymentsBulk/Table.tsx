import { Alert, Table } from 'antd'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { getDefaultColumns } from '@common/components/Tables/PaymentsBulk/column.config'
import { AppRoutes } from '@utils/constants'

const InvoicesTable: React.FC = () => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.PAYMENT_BULK

  const { companies, service, isLoading, isError } = useInvoicesPaymentContext()
  const [dataSource, setDataSource] = useState([])

  useEffect(() => {
    if (!service || !companies) return setDataSource([])
    setDataSource(companies)
  }, [companies, service])

  const handleDelete = (_id: string) => {
    const newData = [...dataSource]
    setDataSource(newData.filter((item) => item._id !== _id))
  }

  const columns = getDefaultColumns(service, handleDelete)

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <Table
      rowKey="_id"
      size="small"
      pagination={
        !isOnPage && {
          responsive: false,
          size: 'small',
          pageSize: 8,
          position: ['bottomCenter'],
          hideOnSinglePage: true,
        }
      }
      loading={isLoading}
      columns={columns}
      dataSource={dataSource}
      scroll={{ x: 2000 }}
    />
  )
}

export default InvoicesTable
