import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { usePaymentContext } from '@components/AddPaymentModal'
import { getPaymentProviderAndReciever } from '@utils/helpers'
import { Form } from 'antd'
import { useDeferredValue, useMemo } from 'react'

/**
 * The invoice as it would be saved right now: the form's current values plus
 * the provider/receiver blocks of the selected company. Feeds the previews,
 * which used to get a snapshot taken only when the form was submitted.
 *
 * Null until a company is known - without it there are no parties to show.
 */
export const useLivePayment = (): IExtendedPayment | null => {
  const { form, company } = usePaymentContext()
  // Deferred, so that re-rendering a whole invoice template never holds up
  // typing in the form.
  const values = useDeferredValue(Form.useWatch([], form))

  return useMemo(() => {
    if (!values || !company) return null
    const { provider, reciever } = getPaymentProviderAndReciever(company)
    return { ...values, provider, reciever } as IExtendedPayment
  }, [values, company])
}

export default useLivePayment
