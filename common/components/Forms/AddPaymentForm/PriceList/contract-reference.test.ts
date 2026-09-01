import { getContractReference } from './contract-reference'

describe('getContractReference', () => {
  it('combines number and date', () => {
    expect(getContractReference('15', '2026-03-01', false)).toBe(
      'Договору № 15 від 01.03.2026'
    )
  })

  it('renders the number alone when there is no date', () => {
    expect(getContractReference('15', undefined, false)).toBe('Договору № 15')
  })

  it('renders the date alone when there is no number', () => {
    expect(getContractReference(undefined, '2026-03-01', false)).toBe(
      'Договору від 01.03.2026'
    )
  })

  it('falls back to the generic wording when nothing is stored', () => {
    expect(getContractReference(undefined, undefined, false)).toBe('Договору')
    expect(getContractReference('', '', false)).toBe('Договору')
  })

  it('strips a leading № or No. so it is not doubled', () => {
    expect(getContractReference('№ 15', undefined, false)).toBe('Договору № 15')
    expect(getContractReference('№15', undefined, false)).toBe('Договору № 15')
    expect(getContractReference('No. 15', undefined, true)).toBe(
      'the Agreement No. 15'
    )
  })

  it('trims surrounding whitespace', () => {
    expect(getContractReference('  15  ', undefined, false)).toBe(
      'Договору № 15'
    )
  })

  it('ignores an unparseable date instead of printing "Invalid Date"', () => {
    expect(getContractReference('15', 'not-a-date', false)).toBe(
      'Договору № 15'
    )
  })

  it('accepts a Date instance', () => {
    expect(getContractReference('15', new Date('2026-03-01'), false)).toBe(
      'Договору № 15 від 01.03.2026'
    )
  })

  it('builds the English wording', () => {
    expect(getContractReference('15', '2026-03-01', true)).toBe(
      'the Agreement No. 15 dated 01.03.2026'
    )
    expect(getContractReference(undefined, undefined, true)).toBe(
      'the Agreement'
    )
  })
})
