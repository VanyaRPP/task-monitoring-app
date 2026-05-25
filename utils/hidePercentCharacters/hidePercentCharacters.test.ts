import { hidePercentCharacters } from './hidePercentCharacters'

describe('hidePercentCharacters', () => {
  it('should hide characters based on 5% rule with minimum 3 visible', () => {
    const cases = [
      { input: 'abcdefghij', expected: 'abc****hij' }, // 10 chars → hide 1 from start/end → show 3+3
      { input: 'abcdefghijklm', expected: 'abc*******klm' }, // 13 chars → hide 1 → visibleStart=3, visibleEnd=10
      { input: 'abcdefghijklmnopqr', expected: 'abc************pqr' }, // 18 chars → long middle mask, keep first/last 3
      { input: 'abcdefghijklmnop', expected: 'abc**********nop' }, // 16 chars → hide 1, leave 3 first + 3 last
      { input: 'abcdefghijklmno', expected: 'abc*********mno' }, // 15 chars → consistent masking
      { input: 'abcdefg', expected: 'abc*efg' }, // 7 chars → slice(0,3) + mask(1) + slice(4)
      { input: 'abcdef', expected: 'abcdef' }, // <= 2*minVisible=6 → return same
      { input: 'abc', expected: 'abc' }, // exactly 3 chars → untouched
      { input: 'ab', expected: 'ab' }, // less than min visible → untouched
      { input: 'a', expected: 'a' }, // single char → untouched
    ]

    cases.forEach(({ input, expected }) => {
      expect(hidePercentCharacters(input)).toBe(expected)
    })
  })
})
