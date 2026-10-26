import type { ExcludedPeriodType, IExcludedPeriod } from './exclusions'

/**
 * What the excluded-period types are called and which dates a preset stands
 * for. Kept out of the calculation, which only ever sees dates.
 *
 * The КМУ №206 preset is the historical span of the general moratorium; it
 * does not decide whether the moratorium applies to a given debt, nor what
 * came after 30.12.2023 (КМУ №1405) - such cases are added as custom periods.
 */
export const EXCLUDED_PERIOD_TYPES: Record<
  ExcludedPeriodType,
  { label: string; startDate?: string; endDate?: string }
> = {
  cmu_206: {
    label: 'КМУ №206',
    startDate: '2022-02-24',
    endDate: '2023-12-29',
  },
  custom: { label: 'Довільний' },
}

/** `2022-02-24` → `24.02.2022`. */
export const formatExclusionDate = (value: string): string =>
  value.split('-').reverse().join('.')

/** `КМУ №206: 24.02.2022—29.12.2023` - how a period is shown and printed. */
export const describeExcludedPeriod = ({
  type,
  startDate,
  endDate,
}: Pick<IExcludedPeriod, 'type' | 'startDate' | 'endDate'>): string =>
  `${EXCLUDED_PERIOD_TYPES[type]?.label ?? type}: ${formatExclusionDate(
    startDate
  )}—${formatExclusionDate(endDate)}`

export const EXCLUSION_NOTE =
  'Інфляційні втрати та річні за зазначені періоди не нараховувалися.'
