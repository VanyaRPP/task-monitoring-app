import { createContext, useContext } from 'react'
import InvoicesHeader from './InvoicesHeader'
import TableCard from '@common/components/UI/TableCard'
import { Form, FormInstance } from 'antd'

export const InvoicesPaymentContext = createContext(
  {} as {
    form: FormInstance
  }
)

export const useInvoicesPaymentContext = () =>
  useContext(InvoicesPaymentContext)

const PaymentsBulkTable: React.FC = () => {
  const [form] = Form.useForm()

  return (
    <InvoicesPaymentContext.Provider value={{ form }}>
      <Form form={form} layout="vertical">
        <TableCard title={<InvoicesHeader />}>
          {/* TODO: add content */}
        </TableCard>
      </Form>
    </InvoicesPaymentContext.Provider>
  )
}

export default PaymentsBulkTable
