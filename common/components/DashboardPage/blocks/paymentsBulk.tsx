import InvoicesHeader from '@common/components/Tables/PaymentsBulk/Header'
import InvoicesTable from '@common/components/Tables/PaymentsBulk/Table'
import TableCard from '@common/components/UI/TableCard'
import { FormInstance, Form } from 'antd'
import { createContext, useContext } from 'react'

export const InvoicesPaymentContext = createContext(
  {} as {
    form: FormInstance
  }
)

export const useInvoicesPaymentContext = () =>
  useContext(InvoicesPaymentContext)

const PaymentBulkBlock: React.FC = () => {
  const [form] = Form.useForm()

  return (
    <InvoicesPaymentContext.Provider value={{ form }}>
      <Form form={form} layout="vertical">
        <TableCard title={<InvoicesHeader />}>
          <InvoicesTable />
        </TableCard>
      </Form>
    </InvoicesPaymentContext.Provider>
  )
}

export default PaymentBulkBlock
