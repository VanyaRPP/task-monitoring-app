import { expect } from '@jest/globals'
import type { FormInstance } from 'antd'
import {
  calculatePercentage,
  convertToInvoicesObject,
  filterInvoiceObject,
  filterOptions,
  formatDateDMY,
  formatDateWithGenitiveMonthCapitalized,
  generateColorsArray,
  getCount,
  getDefaultStartDate,
  getFilterForAddress,
  getFilterForDomain,
  getFormattedAddress,
  getModifiedObjectOfFormInstance,
  getName,
  getPaymentProviderAndReciever,
  getRandomColor,
  invoiceCoutWater,
  isProtectedService,
  toTimestamp,
} from '..'
import { ServiceType, defaultServices } from '@utils/constants'

describe('getCount', () => {
  const tasks = [{ category: 'a' }, { category: 'b' }, { category: 'a' }, {}]

  it('returns tasks whose category matches the name', () => {
    expect(getCount(tasks, 'a')).toEqual([{ category: 'a' }, { category: 'a' }])
  })

  it('returns an empty array when nothing matches', () => {
    expect(getCount(tasks, 'z')).toEqual([])
  })

  it('returns undefined for nullish input', () => {
    expect(getCount(undefined, 'a')).toBeUndefined()
  })
})

describe('getModifiedObjectOfFormInstance', () => {
  it('merges the provided name/value pairs over the form values', () => {
    const form = {
      getFieldsValue: () => ({ a: 1, b: 2 }),
    } as unknown as FormInstance

    const result = getModifiedObjectOfFormInstance(form, [
      { name: 'b', value: 20 },
      { name: 'c', value: 3 },
    ])

    expect(result).toEqual({ a: 1, b: 20, c: 3 })
  })
})

describe('getFormattedAddress', () => {
  it('keeps street + house number when the chunk after the street is numeric', () => {
    expect(getFormattedAddress('вул. Хрещатик,5')).toBe('вул. Хрещатик, 5')
  })

  it('drops a non-numeric second chunk for a street address', () => {
    expect(getFormattedAddress('вулиця Миру')).toBe('вулиця Миру')
  })

  it('re-joins comma-separated parts for a non-street address', () => {
    expect(getFormattedAddress('A,B')).toBe('A, B')
  })

  it('returns undefined for an empty/absent address', () => {
    expect(getFormattedAddress('')).toBeUndefined()
    expect(getFormattedAddress(undefined as unknown as string)).toBeUndefined()
  })
})

describe('getName', () => {
  it('returns the value stored under the matching key', () => {
    expect(getName('b', { a: 1, b: 2 })).toBe(2)
  })

  it('returns null when no key matches', () => {
    expect(getName('z', { a: 1 })).toBeNull()
  })
})

describe('filterInvoiceObject', () => {
  it('tags known service keys by type and unknown ones as custom', () => {
    const result = filterInvoiceObject({
      electricityPrice: { sum: 100, foo: 1 },
      myService: { sum: 50 },
      notAnObject: 'skip me',
    })

    expect(result).toEqual([
      { type: ServiceType.Electricity, sum: 100, foo: 1 },
      { type: ServiceType.Custom, name: 'myService', sum: 50 },
    ])
  })
})

describe('formatDateDMY', () => {
  it('formats an ISO date as DD-MM-YYYY', () => {
    expect(formatDateDMY('2024-01-05')).toBe('05-01-2024')
  })
})

describe('getDefaultStartDate', () => {
  it('returns a DD-MM-YYYY string (3 months back)', () => {
    expect(getDefaultStartDate()).toMatch(/^\d{2}-\d{2}-\d{4}$/)
  })
})

describe('formatDateWithGenitiveMonthCapitalized', () => {
  it('formats a Date with the Ukrainian genitive month', () => {
    expect(formatDateWithGenitiveMonthCapitalized(new Date(2025, 5, 20))).toBe(
      '20 Червня 2025'
    )
    expect(formatDateWithGenitiveMonthCapitalized(new Date(2024, 0, 1))).toBe(
      '1 Січня 2024'
    )
  })
})

describe('getPaymentProviderAndReciever', () => {
  it('maps a company to provider + reciever', () => {
    const company = {
      companyName: 'Acme',
      adminEmails: ['a@b.c'],
      description: 'desc',
      domain: { description: 'domain desc' },
    }

    expect(getPaymentProviderAndReciever(company)).toEqual({
      provider: { description: 'domain desc' },
      reciever: {
        companyName: 'Acme',
        adminEmails: ['a@b.c'],
        description: 'desc',
      },
    })
  })

  it('falls back to an empty provider description when domain is missing', () => {
    const { provider } = getPaymentProviderAndReciever({ companyName: 'C' })
    expect(provider).toEqual({ description: '' })
  })

  it('returns nullish provider/reciever for a nullish company', () => {
    expect(getPaymentProviderAndReciever(null)).toEqual({
      provider: null,
      reciever: null,
    })
  })
})

describe('filterOptions', () => {
  it('seeds $in from the comma-separated ids when absent', () => {
    expect(filterOptions({ foo: 1 }, 'a,b')).toEqual({
      foo: 1,
      $in: ['a', 'b'],
    })
  })

  it('intersects an existing $in with the filter ids', () => {
    expect(filterOptions({ $in: ['a', 'b', 'c'] }, 'a,c')).toEqual({
      $in: ['a', 'c'],
    })
  })
})

describe('invoiceCoutWater', () => {
  it('computes the share of the total water price', () => {
    expect(invoiceCoutWater(50, { waterPriceTotal: 200 })).toBe('100.00')
    expect(invoiceCoutWater(25, { waterPriceTotal: 10 })).toBe('2.50')
  })

  it('returns 0 when waterPart or service is falsy', () => {
    expect(invoiceCoutWater(0, { waterPriceTotal: 200 })).toBe(0)
    expect(invoiceCoutWater(50, null)).toBe(0)
  })
})

describe('convertToInvoicesObject', () => {
  it('keys items by type and fills type-specific defaults', () => {
    const result = convertToInvoicesObject([
      { type: ServiceType.Maintenance, sum: 10 },
      { type: ServiceType.Water, sum: 20, amount: 5 },
      { type: ServiceType.Custom, sum: 7, price: 7 },
    ])

    expect(result).toEqual({
      [ServiceType.Maintenance]: { sum: 10, amount: 0, price: 10 },
      [ServiceType.Water]: { sum: 20, amount: 5, lastAmount: 0, price: 20 },
      [ServiceType.Custom]: { sum: 7, price: 7 },
    })
  })
})

describe('getRandomColor', () => {
  afterEach(() => jest.restoreAllMocks())

  it('builds a #rrggbb color from Math.random', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0)
    expect(getRandomColor()).toBe('#000000')

    jest.spyOn(Math, 'random').mockReturnValue(0.9999)
    expect(getRandomColor()).toBe('#FFFFFF')
  })

  it('produces a valid hex color without mocking', () => {
    expect(getRandomColor()).toMatch(/^#[0-9A-F]{6}$/)
  })
})

describe('calculatePercentage', () => {
  it('converts values to their percentage of the total', () => {
    expect(calculatePercentage([25, 75])).toEqual([25, 75])
    expect(calculatePercentage([1, 1, 2])).toEqual([25, 25, 50])
    expect(calculatePercentage([10])).toEqual([100])
  })

  it('returns an empty array for empty input', () => {
    expect(calculatePercentage([])).toEqual([])
  })
})

describe('generateColorsArray', () => {
  it('slices the preset palette when length <= 5', () => {
    expect(generateColorsArray(3)).toEqual(['#b4e4fc', '#e4fcb4', '#fcb4b4'])
    expect(generateColorsArray(0)).toEqual([])
  })

  it('appends random colors beyond the 5 presets', () => {
    const result = generateColorsArray(7)
    expect(result).toHaveLength(7)
    expect(result.slice(0, 5)).toEqual(generateColorsArray(5))
    result.slice(5).forEach((c) => expect(c).toMatch(/^#[0-9A-F]{6}$/i))
  })
})

describe('getFilterForAddress', () => {
  it('builds unique address filter options deduped by text', () => {
    const result = getFilterForAddress([
      { streetData: { address: 'Soborna', city: 'Lviv', _id: '1' } },
      { streetData: { address: 'Soborna', city: 'Lviv', _id: '2' } },
      { streetData: { address: 'Shevchenka', city: 'Kyiv', _id: '3' } },
    ])

    expect(result).toEqual([
      { text: 'Soborna (м. Lviv)', value: '1' },
      { text: 'Shevchenka (м. Kyiv)', value: '3' },
    ])
  })
})

describe('getFilterForDomain', () => {
  it('maps domains to text/value filter options', () => {
    const result = getFilterForDomain([
      { domainDetails: { name: 'Dom', _id: 'd1' } },
      { domainDetails: { name: 'Dom2', _id: 'd2' } },
    ])

    expect(result).toEqual([
      { text: 'Dom', value: 'd1' },
      { text: 'Dom2', value: 'd2' },
    ])
  })
})

describe('toTimestamp', () => {
  it('formats a date as HH:MM:SS.mmm with zero-padding', () => {
    expect(toTimestamp(new Date(2024, 0, 1, 9, 5, 3, 7))).toBe('09:05:03.007')
    expect(toTimestamp(new Date(2024, 0, 1, 23, 59, 59, 999))).toBe(
      '23:59:59.999'
    )
  })

  it('defaults to the current time', () => {
    expect(toTimestamp()).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/)
  })
})

describe('isProtectedService', () => {
  it('is true only for ids in the default services set', () => {
    expect(isProtectedService(defaultServices[0])).toBe(true)
    expect(isProtectedService('not-a-real-id')).toBe(false)
  })

  it('is false for an absent id', () => {
    expect(isProtectedService()).toBe(false)
    expect(isProtectedService('')).toBe(false)
  })
})
