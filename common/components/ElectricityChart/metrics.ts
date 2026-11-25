import type { IElectricityRow } from './electricityHistory'

export type MetricKey = 'tariff' | 'total' | 'consumed' | 'losses'

export interface IMetric {
  key: MetricKey
  /** Row field to plot; the tariff and the total follow the VAT switch. */
  field: Exclude<keyof IElectricityRow, 'month'>
  name: string
  unit: string
}

export const getMetrics = (withVat: boolean): IMetric[] => [
  {
    key: 'tariff',
    field: withVat ? 'tariffWithVat' : 'tariffWithoutVat',
    name: withVat ? 'Тариф' : 'Тариф без ПДВ',
    unit: 'грн/кВт',
  },
  {
    key: 'total',
    field: withVat ? 'totalWithVat' : 'totalWithoutVat',
    name: withVat ? 'Всього з ПДВ' : 'Всього без ПДВ',
    unit: 'грн',
  },
  { key: 'consumed', field: 'consumed', name: 'Спожито', unit: 'кВт' },
  {
    key: 'losses',
    field: 'losses',
    name: 'Втрати в трансформаторі, лініях, реактивна',
    unit: '%',
  },
]

/**
 * A colour belongs to its metric, so hiding one never repaints the others. Both
 * sets are checked for colour blindness and contrast against their surface.
 */
export const METRIC_COLORS: Record<
  'light' | 'dark',
  Record<MetricKey, string>
> = {
  light: {
    tariff: '#257de0',
    total: '#d9601c',
    consumed: '#009578',
    losses: '#6a4ce2',
  },
  dark: {
    tariff: '#338ced',
    total: '#e76624',
    consumed: '#00a888',
    losses: '#9887ef',
  },
}

export const formatValue = (value: number | null): string =>
  value === null
    ? '—'
    : value.toLocaleString('uk-UA', { maximumFractionDigits: 2 })

const compact = new Intl.NumberFormat('uk-UA', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** Axis ticks get little room: 250000 reads as "250 тис.". */
export const formatAxisValue = (value: number): string =>
  Math.abs(value) >= 10_000 ? compact.format(value) : formatValue(Number(value))
