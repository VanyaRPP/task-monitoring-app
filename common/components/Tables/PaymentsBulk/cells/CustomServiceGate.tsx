import type { ReactNode } from 'react'
import { Form } from 'antd'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { companyHasCustomService } from '../companyHasCustomService'

interface Props {
  name: number
  serviceKey: string
  fieldName?: string
  children: ReactNode
}

/**
 * Renders its children only when the company on this row actually uses the
 * custom service (a customServices entry with a price > 0). On every other row
 * the cell is blank — mirroring how the built-in cells (e.g. Cleaning) hide
 * themselves when the company lacks the service.
 */
export const CustomServiceGate: React.FC<Props> = ({
  name,
  serviceKey,
  fieldName,
  children,
}) => {
  const { form } = useInvoicesPaymentContext()
  const companyCustoms = Form.useWatch(
    ['payments', name, 'company', 'customServices'],
    form
  )

  return companyHasCustomService(companyCustoms, { serviceKey, fieldName }) ? (
    <>{children}</>
  ) : null
}
