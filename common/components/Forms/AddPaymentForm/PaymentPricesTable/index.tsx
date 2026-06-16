import { usePaymentContext } from '@components/AddPaymentModal'
import { keepInvoiceRow } from '@components/AddPaymentModal/invoiceRowFilter'
import { EditInvoicesTable_unstable } from '@components/Tables/EditInvoiceTable'
import { IService } from '@common/api/serviceApi/service.api.types'
import { Form } from 'antd'
import { useEffect } from 'react'

export interface PaymentPricesTableProps {
  preview?: boolean
  loading?: boolean
  service?: IService
}

/**
 * @param preview describes that table is in PREVIEW mode
 * @param loading describes that table is loading
 */
const PaymentPricesTable: React.FC<PaymentPricesTableProps> = ({
  preview,
  loading,
}) => {
  const { form, service, company, prevPayment } = usePaymentContext()
  const domainId = Form.useWatch('domain', form)
  const invoices = form.getFieldValue('invoice')

  useEffect(() => {
    const filteredInvoices = invoices?.filter(keepInvoiceRow)

    form.setFieldsValue({
      invoice: filteredInvoices,
    })
  }, [])

  return (
    <EditInvoicesTable_unstable
      form={form}
      editable={!preview}
      loading={loading}
      service={service}
      company={company}
      prevPayment={prevPayment}
      domainId={domainId}
    />
  )
}

export default PaymentPricesTable
