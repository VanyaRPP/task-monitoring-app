import { transliterateAndCamelCase } from './transliterateAndCamelCase'

describe('transliterateAndCamelCase', () => {
  it('transliterates Ukrainian text and camelCases the words', () => {
    expect(transliterateAndCamelCase('Вода холодна')).toBe('vodaKholodna')
  })

  it('strips parenthesized suffixes before transliterating', () => {
    expect(transliterateAndCamelCase('Вода (гаряча)')).toBe('voda')
  })

  it('passes through characters outside the transliteration map unchanged', () => {
    // Ё/ё match the Cyrillic regex range but have no entry in the map, so the
    // `|| char` fallback on the replace callback keeps them as-is.
    expect(transliterateAndCamelCase('ёлка')).toBe('ёlka')
  })
})
