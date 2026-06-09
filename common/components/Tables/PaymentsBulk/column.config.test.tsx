import { ServiceType } from '@utils/constants'
import { getDefaultColumns } from './column.config'

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

  it('identifies a communal service by its serviceType (per-domain copy)', () => {
    // A per-domain copy keeps its own non-pinned _id + transliterated fieldName,
    // but carries the type in serviceType.
    const titles = stringTitles([
      {
        _id: 'domain-copy-1',
        name: 'Прибирання приміщень',
        fieldName: 'prybyrannia',
        serviceType: ServiceType.Cleaning,
      },
    ])

    expect(titles).toContain('Прибирання')
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
