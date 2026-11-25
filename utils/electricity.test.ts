import { expect } from '@jest/globals'
import {
  getLossesPercent,
  getPriceWithoutVat,
  getTotalWithVat,
} from './electricity'

describe('electricity calculation', () => {
  it('derives the tariff without VAT and the total with VAT', () => {
    expect(getPriceWithoutVat(12)).toBeCloseTo(10)
    expect(getTotalWithVat(11000)).toBeCloseTo(13200)
  })

  it('calculates losses as the excess of the bill over tariff × consumed', () => {
    expect(
      getLossesPercent({
        priceWithVat: 12,
        consumed: 1000,
        totalWithoutVat: 11000,
      })
    ).toBeCloseTo(10)
  })

  it('keeps a negative result when the bill is below tariff × consumed', () => {
    expect(
      getLossesPercent({
        priceWithVat: 12,
        consumed: 1000,
        totalWithoutVat: 9000,
      })
    ).toBeCloseTo(-10)
  })

  it.each([
    ['tariff', { consumed: 1000, totalWithoutVat: 11000 }],
    ['consumed', { priceWithVat: 12, totalWithoutVat: 11000 }],
    ['total', { priceWithVat: 12, consumed: 1000 }],
    ['non-zero total', { priceWithVat: 12, consumed: 1, totalWithoutVat: 0 }],
  ])('returns null without a %s', (_, input) => {
    expect(getLossesPercent(input)).toBeNull()
  })
})
