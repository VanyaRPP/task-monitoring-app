import {
  GITHUB_DIFF_DARK,
  GITHUB_DIFF_LIGHT,
  isDarkSurface,
  pickDiffColors,
} from './diffColors'

describe('isDarkSurface', () => {
  it('recognises the antd light and dark container backgrounds', () => {
    expect(isDarkSurface('#ffffff')).toBe(false)
    expect(isDarkSurface('#141414')).toBe(true)
  })

  it('accepts short hex and rgb/rgba notation', () => {
    expect(isDarkSurface('#fff')).toBe(false)
    expect(isDarkSurface('#000')).toBe(true)
    expect(isDarkSurface('rgb(255, 255, 255)')).toBe(false)
    expect(isDarkSurface('rgba(20, 20, 20, 0.9)')).toBe(true)
  })

  it('falls back to light for anything it cannot parse', () => {
    expect(isDarkSurface('transparent')).toBe(false)
    expect(isDarkSurface('')).toBe(false)
  })
})

describe('pickDiffColors', () => {
  it('serves the light palette on a light surface', () => {
    expect(pickDiffColors('#ffffff')).toBe(GITHUB_DIFF_LIGHT)
  })

  it('serves the translucent dark palette on a dark surface', () => {
    expect(pickDiffColors('#141414')).toBe(GITHUB_DIFF_DARK)
  })

  it('keeps the dark palette translucent so text stays readable', () => {
    const values = [
      GITHUB_DIFF_DARK.before.line,
      GITHUB_DIFF_DARK.before.word,
      GITHUB_DIFF_DARK.after.line,
      GITHUB_DIFF_DARK.after.word,
      GITHUB_DIFF_DARK.filler,
    ]

    expect(values.every((value) => value.startsWith('rgba('))).toBe(true)
  })

  it('uses a stronger shade for word level than for line level', () => {
    expect(GITHUB_DIFF_LIGHT.before.line).not.toBe(
      GITHUB_DIFF_LIGHT.before.word
    )
    expect(GITHUB_DIFF_LIGHT.after.line).not.toBe(GITHUB_DIFF_LIGHT.after.word)
  })
})
