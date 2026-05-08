import { FormInstance } from 'antd'
import { useEffect } from 'react'

/**
 * Writes `computedSum` into the invoice row's `sum` field whenever it changes.
 * Each invoice type's Sum component is responsible for deriving its own sum
 * from local watched inputs (price/amount/lastAmount/losses/...) and passing
 * the result here. Centralizing the write avoids 9 near-identical useEffects.
 */
export const useSyncSum = (
  form: FormInstance,
  name: (string | number)[],
  computedSum: number
) => {
  useEffect(() => {
    form.setFieldValue(['invoice', ...name, 'sum'], computedSum)
    // `name` is a fresh array on each render — depend on its joined string so
    // identical-content arrays don't retrigger the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, name.join('.'), computedSum])
}

export default useSyncSum
