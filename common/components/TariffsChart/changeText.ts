import { formatValue } from '@utils/formatChartValue'
import type { ITariffChange } from './tariffHistory'

/** «↑ 0,5 грн/м² (+4,2 %) з 01.2026» - the change in words and figures. */
export const getChangeText = (
  change: ITariffChange | null,
  unit?: string
): string => {
  if (!change) return 'Тариф є лише за один місяць'

  const { since, diff, percent } = change
  if (!diff) return `Стільки ж, як у ${since}`

  const arrow = diff > 0 ? '↑' : '↓'
  const amount = formatValue(Math.abs(diff))

  // A percentage of a percentage would mislead: an index moves in points.
  if (unit === '%') return `${arrow} ${amount} в. п. з ${since}`

  const share =
    percent === null
      ? ''
      : ` (${percent > 0 ? '+' : '−'}${Math.abs(percent).toLocaleString(
          'uk-UA',
          { maximumFractionDigits: 1 }
        )} %)`

  return `${arrow} ${amount}${unit ? ` ${unit}` : ''}${share} з ${since}`
}
