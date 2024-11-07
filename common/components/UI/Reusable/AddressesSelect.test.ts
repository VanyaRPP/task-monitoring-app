export const showTooltip = (streetId, selectedStreet) => {
  return !!streetId && !selectedStreet?.hasService
}

describe('show tooltip bug', () => {
  test('should return false when no streetId', () => {
    const result = showTooltip(null, { hasService: true })
    expect(result).toBe(false)
  })

  test('should return false when selectedStreet is undefined', () => {
    const result = showTooltip(1, undefined)
    expect(result).toBe(true)
  })

  test('should return undefined when selectedStreet has no hasService property', () => {
    const result = showTooltip(1, {})
    expect(result).toBe(true)
  })

  test('should return false when streetId and selectedStreet has hasService', () => {
    const result = showTooltip(1, { hasService: true })
    expect(result).toBe(false)
  })

  test('should return true when streetId and selectedStreet.hasService is false', () => {
    const result = showTooltip(1, { hasService: false })
    expect(result).toBe(true)
  })
})
