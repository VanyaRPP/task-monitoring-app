import { FormInstance } from 'antd'
import { roundMoney } from '@utils/helpers'
import { useEffect } from 'react'

/**
 * Writes `computedSum` into the invoice row's `sum` field whenever it changes.
 * Each invoice type's Sum component is responsible for deriving its own sum
 * from local watched inputs (price/amount/lastAmount/losses/...) and passing
 * the result here. Centralizing the write avoids 9 near-identical useEffects.
 *
 * The sum is stored rounded to 2 decimals: the formulas are plain float
 * arithmetic, and their noise (0.1 * 3 = 0.30000000000000004) would otherwise
 * be saved with the invoice and carried into its total.
 */
export const useSyncSum = (
  form: FormInstance,
  name: (string | number)[],
  computedSum: number
) => {
  const sum = Number.isFinite(computedSum)
    ? roundMoney(computedSum)
    : computedSum

  useEffect(() => {
    form.setFieldValue(['invoice', ...name, 'sum'], sum)
    // `name` is a fresh array on each render — depend on its joined string so
    // identical-content arrays don't retrigger the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, name.join('.'), sum])
}

export default useSyncSum
