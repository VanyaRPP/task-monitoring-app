import { usePaymentContext } from '@components/AddPaymentModal'
import { EditInvoicesTable_unstable } from '@components/Tables/EditInvoiceTable'
import { useEffect } from 'react'

export interface PaymentPricesTableProps {
  preview?: boolean
  loading?: boolean
}

/**
 * @param preview describes that table is in PREVIEW mode
 * @param loading describes that table is loading
 */
const PaymentPricesTable: React.FC<PaymentPricesTableProps> = ({
  preview,
  loading,
}) => {
  const { form, service } = usePaymentContext()
  const invoices = form.getFieldValue('invoice')

  useEffect(() => {
    const filteredInvoices = invoices?.filter(
      (invoice) =>
        invoice?.sum > 0 ||
        ['discount', 'maintenancePrice', 'garbageCollectorPrice'].includes(
          invoice?.type
        )
    )

    form.setFieldsValue({
      invoice: filteredInvoices,
    })
  }, [])

  return (
    <EditInvoicesTable_unstable
      form={form}
      editable={!preview}
      loading={loading}
    />
  )
}

export default PaymentPricesTable
