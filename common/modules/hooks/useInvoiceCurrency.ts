import { Form } from 'antd'
import { usePaymentContext } from '@components/AddPaymentModal'
import { Currency } from '@utils/constants'
import { normalizeCurrency } from '@utils/helpers'

export function useInvoiceCurrency(): Currency {
  const { form, company, payment } = usePaymentContext()
  const selectedCurrency = Form.useWatch('currency', form)
  return normalizeCurrency(
    selectedCurrency || payment?.currency || company?.currency
  )
}
