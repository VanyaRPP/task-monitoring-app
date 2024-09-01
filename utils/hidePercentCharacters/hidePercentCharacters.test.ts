import { hidePercentCharacters } from './hidePercentCharacters'

describe('hidePercentCharacters', () => {
  it('should hide first and last 5% of characters, with a minimum of 3 visible characters', () => {
    const cases = [
      { input: 'abcdefghij', expected: 'abc****ghi' }, // 10 characters, 5% = 0.5 -> 1 character hidden
      { input: 'abcdefghijklm', expected: 'ab***ghijklm' }, // 13 characters, 5% = 0.65 -> 1 character hidden
      { input: 'abcdefghijklmnopqr', expected: 'abc*****opqr' }, // 18 characters, 5% = 0.9 -> 1 character hidden
      { input: 'abcdefghijklmnop', expected: 'abc*****nop' }, // 16 characters, 5% = 0.8 -> 1 character hidden
      { input: 'abcdefghij', expected: 'abc****ghi' }, // 10 characters, 5% = 0.5 -> 1 character hidden
      { input: 'ab', expected: 'ab' }, // Less than 6 characters
      { input: 'abc', expected: 'abc' }, // Exactly 3 characters
      { input: 'abcdefghijklmno', expected: 'abc****lmno' }, // 15 characters, 5% = 0.75 -> 1 character hidden
      { input: 'a', expected: 'a' }, // Single character
      { input: 'abcdef', expected: 'ab***ef' }, // 6 characters, 5% = 0.3 -> 1 character hidden
      { input: 'abcdefg', expected: 'ab****g' }, // 7 characters, 5% = 0.35 -> 1 character hidden
    ]

    cases.forEach(({ input, expected }) => {
      expect(hidePercentCharacters(input)).toBe(expected)
    })
  })
})
