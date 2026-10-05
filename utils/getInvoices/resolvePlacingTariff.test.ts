import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import {
  findPlacingServiceItem,
  resolvePlacingTariff,
} from '@utils/getInvoices/resolvePlacingTariff'
import { transliterateAndCamelCase } from '@utils/transliterateAndCamelCase'

/** Закріплені _id сидів (UTILITY_SERVICE_ID_ENTRIES у utils/constants.ts). */
const PLACING_ID = '682dd48d9665126611c81950'
const MAINTENANCE_ID = '677d414283b6ef93c6b8ea2c'

const maintenanceItem = (price: number) => ({
  _id: MAINTENANCE_ID as any,
  label: 'Утримання приміщень (грн/м²)',
  fieldName: 'rentPrice',
  price,
})

const placingItem = (price: number, fieldName = 'placingPrice') => ({
  _id: PLACING_ID as any,
  label: 'Розміщення',
  fieldName,
  price,
})

const service = (overrides: Partial<IService> = {}): Partial<IService> => ({
  rentPrice: 0,
  customServices: [],
  ...overrides,
})

const company = (
  overrides: Partial<IRealestate> = {}
): Partial<IRealestate> => ({
  totalArea: 100,
  pricePerMeter: 0,
  ...overrides,
})

describe('findPlacingServiceItem', () => {
  it('знаходить сид «Розміщення» за закріпленим _id', () => {
    const item = placingItem(10, transliterateAndCamelCase('Розміщення'))

    expect(findPlacingServiceItem(service({ customServices: [item] }))).toBe(
      item
    )
  })

  it('знаходить легасі-рядок за fieldName = placingPrice', () => {
    const item = { ...placingItem(10), _id: 'some-other-id' as any }

    expect(findPlacingServiceItem(service({ customServices: [item] }))).toBe(
      item
    )
  })

  it('не плутає Розміщення з Утриманням', () => {
    expect(
      findPlacingServiceItem(service({ customServices: [maintenanceItem(10)] }))
    ).toBeUndefined()
  })

  it('ігнорує per-domain копію з власним _id і своїм fieldName', () => {
    // Такі послуги рендеряться власною колонкою-формулою і не мають
    // підміняти нативний тариф Розміщення.
    const copy = {
      _id: '68a0000000000000000000a1' as any,
      label: 'Розміщення (склад)',
      fieldName: 'rozmishchenniaSklad',
      price: 50,
    }

    expect(
      findPlacingServiceItem(service({ customServices: [copy] }))
    ).toBeUndefined()
  })

  it.each([[undefined], [null], [{}], [{ customServices: null }]])(
    'не падає на порожній послузі (%p)',
    (input) => {
      expect(findPlacingServiceItem(input as any)).toBeUndefined()
    }
  )
})

describe('resolvePlacingTariff — пріоритет джерел', () => {
  it('1. індивідуальна ціна компанії перебиває все', () => {
    expect(
      resolvePlacingTariff({
        company: company({ pricePerMeter: 25 }),
        service: service({
          rentPrice: 10,
          customServices: [placingItem(15)],
        }),
      })
    ).toBe(25)
  })

  it('2. далі — тариф Розміщення з місячної послуги', () => {
    expect(
      resolvePlacingTariff({
        company: company(),
        service: service({
          rentPrice: 10,
          customServices: [maintenanceItem(10), placingItem(15)],
        }),
      })
    ).toBe(15)
  })

  it('2a. нуль у рядку Розміщення авторитетний — фолбеку на rentPrice НЕ буде', () => {
    // Головний баг, який лагодить цей резолвер: раніше незаповнене
    // Розміщення мовчки брало тариф Утримання і подвоювало рахунок.
    expect(
      resolvePlacingTariff({
        company: company(),
        service: service({
          rentPrice: 10,
          customServices: [maintenanceItem(10), placingItem(0)],
        }),
      })
    ).toBe(0)
  })

  it('3. легасі-домен без Розміщення в каталозі досі падає на rentPrice', () => {
    expect(
      resolvePlacingTariff({
        company: company(),
        service: service({
          rentPrice: 10,
          customServices: [maintenanceItem(10)],
        }),
      })
    ).toBe(10)
  })

  it('3a. легасі-фолбек працює і коли customServices порожні', () => {
    expect(
      resolvePlacingTariff({
        company: company(),
        service: service({ rentPrice: 10 }),
      })
    ).toBe(10)
  })
})

describe('resolvePlacingTariff — межові значення', () => {
  it('pricePerMeter = 0 означає «не задано» (у моделі це default)', () => {
    expect(
      resolvePlacingTariff({
        company: company({ pricePerMeter: 0 }),
        service: service({ customServices: [placingItem(15)] }),
      })
    ).toBe(15)
  })

  it.each([
    ['company = undefined', undefined],
    ['company = {}', {}],
  ])('%s -> тариф беремо з послуги', (_label, companyArg) => {
    expect(
      resolvePlacingTariff({
        company: companyArg as Partial<IRealestate>,
        service: service({ customServices: [placingItem(15)] }),
      })
    ).toBe(15)
  })

  it.each([
    ['service = undefined', undefined],
    ['service = null', null],
    ['service = {}', {}],
  ])('%s -> 0, а не NaN', (_label, serviceArg) => {
    expect(
      resolvePlacingTariff({
        company: company(),
        service: serviceArg as Partial<IService>,
      })
    ).toBe(0)
  })

  it('порожній виклик дає 0', () => {
    expect(resolvePlacingTariff({})).toBe(0)
  })

  it('нечислові ціни зводяться до 0, а не до NaN', () => {
    expect(
      resolvePlacingTariff({
        company: company(),
        service: service({
          customServices: [placingItem(undefined as any)],
        }),
      })
    ).toBe(0)
  })
})
