import { Alert, Form, Table } from 'antd'

import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { getDefaultColumns } from '@common/components/Tables/PaymentsBulk/column.config'
import { AppRoutes } from '@utils/constants'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const InvoicesTable: React.FC = () => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.PAYMENT_BULK

  const { form, companies, isLoading, isError } = useInvoicesPaymentContext()

  useEffect(() => {
    form.setFieldsValue({
      payments: companies?.map((company) => {
        return { company }
      }),
    })
  }, [form, companies])

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <Form.List name="payments">
      {(fields, { remove }) => (
        <Table
          rowKey="name"
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
          columns={getDefaultColumns(remove)}
          dataSource={fields}
          scroll={{ x: 2000 }}
        />
      )}
    </Form.List>
  )
}

export default InvoicesTable
