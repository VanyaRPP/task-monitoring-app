import { escapeRegexForMongo } from './escape-regex'

describe('escapeRegexForMongo', () => {
  it('escapes regex metacharacters', () => {
    expect(escapeRegexForMongo('a+b')).toBe('a\\+b')
    expect(escapeRegexForMongo('price$')).toBe('price\\$')
  })
})
