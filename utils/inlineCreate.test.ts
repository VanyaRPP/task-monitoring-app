import {
  getNewEntityName,
  isNewEntityValue,
  makeNewEntityValue,
} from './inlineCreate'

describe('inlineCreate sentinel', () => {
  it('wraps a name into a new-entity value verbatim (no trim)', () => {
    expect(makeNewEntityValue('Моя ОСББ')).toBe('new::Моя ОСББ')
    // whitespace is preserved so a controlled inline input can keep spaces
    expect(makeNewEntityValue('Моя ')).toBe('new::Моя ')
  })

  it('detects new-entity values', () => {
    expect(isNewEntityValue('new::Моя ОСББ')).toBe(true)
    expect(isNewEntityValue('64f0c0c0c0c0c0c0c0c0c0c0')).toBe(false)
    expect(isNewEntityValue(undefined)).toBe(false)
    expect(isNewEntityValue(123)).toBe(false)
  })

  it('extracts the typed name back', () => {
    expect(getNewEntityName('new::Моя ОСББ')).toBe('Моя ОСББ')
  })

  it('returns a plain id unchanged', () => {
    expect(getNewEntityName('64f0c0c0c0c0c0c0c0c0c0c0')).toBe(
      '64f0c0c0c0c0c0c0c0c0c0c0'
    )
  })

  it('round-trips name -> value -> name', () => {
    const name = 'ТОВ Ромашка'
    expect(getNewEntityName(makeNewEntityValue(name))).toBe(name)
  })
})
