import { Alert, Form, Table } from 'antd'
import { useEffect } from 'react'

import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { getDefaultColumns } from '@common/components/Tables/PaymentsBulk/column.config'
import { AppRoutes } from '@utils/constants'
import { useRouter } from 'next/router'

const InvoicesTable: React.FC = () => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.PAYMENT_BULK

  const { form, companies, service, isLoading, isError } =
    useInvoicesPaymentContext()

  useEffect(() => {
    if (service) {
      form.setFieldsValue({ companies })
    }
  }, [form, companies, service])

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <Form.List name="companies">
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
