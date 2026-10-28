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

/**
 * Whether a calculation that was never saved starts with the КМУ №206
 * moratorium on. A calculation already saved keeps what it was saved with, so
 * switching this changes only new ones.
 *
 * On by default because it is the safe side for a claim: switched on where it
 * does not apply, a claim comes out smaller; switched off where it does, it
 * claims what the moratorium forbids. Pending the lawyer's confirmation that it
 * applies to HOA contributions.
 */
export const CMU_206_BY_DEFAULT = true

/** The КМУ №206 span as an excluded period. */
export const cmu206Period = (id = 'cmu_206'): IExcludedPeriod => ({
  id,
  type: 'cmu_206',
  startDate: EXCLUDED_PERIOD_TYPES.cmu_206.startDate,
  endDate: EXCLUDED_PERIOD_TYPES.cmu_206.endDate,
})

const DEFAULT_EXCLUDED_PERIODS: IExcludedPeriod[] = CMU_206_BY_DEFAULT
  ? [cmu206Period('cmu_206_default')]
  : []

/**
 * The excluded periods a calculation runs with: its own list when it has one,
 * else - only for a calculation that was never saved - the default. One rule
 * for the page and for the debtors list, so their sums agree.
 */
export const resolveExcludedPeriods = (
  own: IExcludedPeriod[] | undefined,
  hasSavedCalculation: boolean
): IExcludedPeriod[] =>
  own ?? (hasSavedCalculation ? [] : DEFAULT_EXCLUDED_PERIODS)

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
