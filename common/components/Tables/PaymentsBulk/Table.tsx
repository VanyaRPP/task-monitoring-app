import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { getDefaultColumns } from '@common/components/Tables/PaymentsBulk/column.config'
import { AppRoutes, Operations } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'
import { Alert, Form, Table } from 'antd'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const InvoicesTable: React.FC = () => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.PAYMENT_BULK

  const {
    form,
    service,
    companies,
    prevPayments,
    prevService,
    isLoading,
    isError,
  } = useInvoicesPaymentContext()

  useEffect(() => {
    if (!companies || companies.length === 0 || !service) {
      return form.setFieldsValue({ payments: [] })
    }

    form.setFieldsValue({
      payments: companies?.map((company) => {
        const prevPayment = prevPayments?.find(
          (payment) =>
            // TODO: fix typing of IPayment and IExtendedPayment
            // eslint-disable-next-line
            // @ts-ignore
            payment.company?._id === company._id &&
            payment.type === Operations.Debit
        )

        const invoice = getInvoices({
          company,
          service,
          prevService,
          prevPayment,
        }).reduce((acc, invoice) => {
          acc[invoice.name || invoice.type] = invoice
          return acc
        }, {})

        return {
          company,
          invoice,
        }
      }),
    })
  }, [form, service, companies, prevService, prevPayments])

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <Form.List name="payments">
      {(fields, { remove }) => (
        <Table
          rowKey="name"
          size="small"
          pagination={false}
          loading={isLoading}
          columns={getDefaultColumns(remove)}
          dataSource={fields}
          scroll={{ x: 3000 }}
        />
      )}
    </Form.List>
  )
}

export default InvoicesTable
