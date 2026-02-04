import { pickHighestRole, normalizeRoles } from './roles'

describe('pickHighestRole', () => {
  it('returns GlobalAdmin if present in array', () => {
    expect(pickHighestRole(['User', 'GlobalAdmin'])).toBe('GlobalAdmin')
  })

  it('returns DomainAdmin if GlobalAdmin is not present', () => {
    expect(pickHighestRole(['User', 'DomainAdmin'])).toBe('DomainAdmin')
  })

  it('returns User if only User is present', () => {
    expect(pickHighestRole(['User'])).toBe('User')
  })

  it('returns User if input is a single string', () => {
    expect(pickHighestRole('User')).toBe('User')
  })

  it('returns highest role when input is a single high role', () => {
    expect(pickHighestRole('GlobalAdmin')).toBe('GlobalAdmin')
  })

  it('returns User if input contains unknown roles only', () => {
    expect(pickHighestRole(['Admin', 'Moderator'])).toBe('User')
  })

  it('returns User if input is undefined', () => {
    expect(pickHighestRole()).toBe('User')
  })

  it('returns User if input is an empty array', () => {
    expect(pickHighestRole([])).toBe('User')
  })
})

describe('normalizeRoles', () => {
  it('returns array with highest role', () => {
    expect(normalizeRoles(['User', 'DomainAdmin'])).toEqual(['DomainAdmin'])
  })

  it('returns array with single role when input is string', () => {
    expect(normalizeRoles('GlobalAdmin')).toEqual(['GlobalAdmin'])
  })

  it('returns ["User"] when input is undefined', () => {
    expect(normalizeRoles()).toEqual(['User'])
  })

  it('always returns array with exactly one role', () => {
    const result = normalizeRoles(['User', 'GlobalAdmin', 'DomainAdmin'])
    expect(result).toHaveLength(1)
  })
})
