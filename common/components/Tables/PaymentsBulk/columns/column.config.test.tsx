import { ServiceType } from '@utils/constants'
import {
  buildTypedCustomColumn,
  getDefaultColumns,
  hasTypedColumn,
} from './column.config'

// Mirrors what GET /api/custom-services/domain returns: catalog entries with a
// pinned _id, a display name and a fieldName. For seeded "communal" services
// the fieldName equals the ServiceType value (maintenance -> 'maintenancePrice').
type AllowedService = {
  _id: string
  name: string
  fieldName: string
  serviceType?: string
}

// Pinned _id's of the seeded utility services (see UTILITY_SERVICE_ID_ENTRIES).
const UTILITY_IDS = {
  maintenance: '677d414283b6ef93c6b8ea2c',
  placing: '682dd48d9665126611c81950',
  electricity: '68156d2cf520914e5e1ad87c',
  water: '68156cdbf520914e5e1ad877',
  waterPart: '677d412483b6ef93c6b8e9fa',
  garbage: '68156d58f520914e5e1ad881',
  cleaning: '677d434c83b6ef93c6b8ea3a',
} as const

const COMMUNAL: Record<string, AllowedService> = {
  maintenance: {
    _id: UTILITY_IDS.maintenance,
    name: 'Утримання приміщень',
    fieldName: ServiceType.Maintenance,
  },
  placing: {
    _id: UTILITY_IDS.placing,
    name: 'Розміщення',
    fieldName: ServiceType.Placing,
  },
  electricity: {
    _id: UTILITY_IDS.electricity,
    name: 'Електропостачання',
    fieldName: ServiceType.Electricity,
  },
  water: {
    _id: UTILITY_IDS.water,
    name: 'Водопостачання',
    fieldName: ServiceType.Water,
  },
  waterPart: {
    _id: UTILITY_IDS.waterPart,
    name: 'Частка водопостачання',
    fieldName: ServiceType.WaterPart,
  },
  garbage: {
    _id: UTILITY_IDS.garbage,
    name: 'Вивіз сміття',
    fieldName: ServiceType.GarbageCollector,
  },
  cleaning: {
    _id: UTILITY_IDS.cleaning,
    name: 'Прибирання',
    fieldName: ServiceType.Cleaning,
  },
}

// Only the columns whose title is a plain string (the ones with element titles —
// Інфляція / Водопостачання "Загальне" — are exercised by their own cell tests).
const stringTitles = (allowed: AllowedService[]): string[] =>
  (getDefaultColumns(jest.fn(), allowed) as Array<{ title?: unknown }>)
    .map((col) => col?.title)
    .filter((title): title is string => typeof title === 'string')

describe('PaymentsBulk getDefaultColumns — communal service columns', () => {
  it('renders a column for every communal service the domain exposes', () => {
    const titles = stringTitles(Object.values(COMMUNAL))

    expect(titles).toContain('Утримання')
    expect(titles).toContain('Розміщення')
    expect(titles).toContain('Електропостачання')
    expect(titles).toContain('Водопостачання')
    expect(titles).toContain('Водопостачання без лічильника')
    expect(titles).toContain('Вивіз ТПВ')
    expect(titles).toContain('Прибирання')
  })

  it.each([
    ['Утримання', COMMUNAL.maintenance],
    ['Розміщення', COMMUNAL.placing],
    ['Електропостачання', COMMUNAL.electricity],
    ['Водопостачання', COMMUNAL.water],
    ['Водопостачання без лічильника', COMMUNAL.waterPart],
    ['Вивіз ТПВ', COMMUNAL.garbage],
    ['Прибирання', COMMUNAL.cleaning],
  ])('shows "%s" when only that communal service is allowed', (title, svc) => {
    expect(stringTitles([svc])).toContain(title)
  })

  it('does NOT render a built-in column for a per-domain serviceType copy', () => {
    // A per-domain copy (own non-pinned _id, transliterated fieldName) carries
    // its type only in `serviceType`. It is rendered as its OWN custom column in
    // the Bulk table (with a per-type formula and its own price), so it must not
    // ALSO trigger the built-in communal column — that would double-render and,
    // lacking a street-service tariff, misprice.
    const titles = stringTitles([
      {
        _id: 'domain-copy-1',
        name: 'Прибирання приміщень',
        fieldName: 'prybyrannia',
        serviceType: ServiceType.Cleaning,
      },
    ])

    expect(titles).not.toContain('Прибирання')
  })

  it('identifies a communal service by a canonical fieldName (legacy row)', () => {
    const titles = stringTitles([
      {
        _id: 'legacy-1',
        name: 'Вивіз ТПВ',
        fieldName: ServiceType.GarbageCollector,
      },
    ])

    expect(titles).toContain('Вивіз ТПВ')
  })

  it('does not render communal columns for a purely custom catalog', () => {
    const titles = stringTitles([
      { _id: 'svc-grechka', name: 'Гречка', fieldName: 'hrechka' },
    ])

    expect(titles).not.toContain('Утримання')
    expect(titles).not.toContain('Вивіз ТПВ')
    expect(titles).not.toContain('Прибирання')
    expect(titles).not.toContain('Водопостачання без лічильника')
  })
})

describe('typed custom services reuse the native builder', () => {
  const childTitles = (col: any): unknown[] =>
    (col?.children ?? []).map((c: any) => c?.title)

  it('hasTypedColumn is true only for types with a builder', () => {
    expect(hasTypedColumn(ServiceType.Electricity)).toBe(true)
    expect(hasTypedColumn(ServiceType.Cleaning)).toBe(false)
    expect(hasTypedColumn(undefined)).toBe(false)
  })

  const elec = (over: Record<string, unknown> = {}) => ({
    _id: 'domain-elec-1',
    name: 'Електрика (підвал)',
    fieldName: 'elektryka_pidval',
    serviceType: ServiceType.Electricity,
    ...over,
  })

  it('builds an electricity column for a per-domain custom, titled by its name', () => {
    const col = buildTypedCustomColumn(elec(), { key: 'domain-elec-1' })

    expect(col).not.toBeNull()
    expect((col as any).title).toBe('Електрика (підвал)')
    // Same shape as the native Electricity column: Стара / Нова / Втрати / … .
    expect(childTitles(col)).toEqual(
      expect.arrayContaining(['Стара', 'Нова', 'Втрати'])
    )
  })

  it('appends "+ Втрати X%" to the custom electricity header when losses > 0', () => {
    const col = buildTypedCustomColumn(elec(), {
      key: 'domain-elec-1',
      losses: 20,
    })
    expect((col as any).title).toBe('Електрика (підвал) + Втрати 20%')
  })

  it('builds a water column for a per-domain water custom', () => {
    const col = buildTypedCustomColumn(
      {
        _id: 'domain-water-1',
        name: 'Вода (двір)',
        fieldName: 'voda_dvir',
        serviceType: ServiceType.Water,
      },
      { key: 'domain-water-1' }
    )
    expect(col).not.toBeNull()
    expect((col as any).title).toBe('Вода (двір)')
    expect(childTitles(col)).toEqual(expect.arrayContaining(['Стара', 'Нова']))
  })

  it('returns null for an untyped custom service (falls back to Кількість/Ціна)', () => {
    expect(
      buildTypedCustomColumn(
        { _id: 'svc-grechka', name: 'Гречка', fieldName: 'hrechka' },
        { key: 'svc-grechka' }
      )
    ).toBeNull()
  })

  it('returns null for a type without a builder yet (e.g. Cleaning)', () => {
    expect(
      buildTypedCustomColumn(
        {
          _id: 'domain-clean-1',
          name: 'Прибирання під’їзду',
          fieldName: 'prybyrannia',
          serviceType: ServiceType.Cleaning,
        },
        { key: 'domain-clean-1' }
      )
    ).toBeNull()
  })
})
