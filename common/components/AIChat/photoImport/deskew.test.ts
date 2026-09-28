import { findSkewAngle, inkMask } from './deskew'

/** Horizontal rules of a table, tilted by `degrees` (clockwise positive). */
const tiltedRules = (degrees: number, width = 300, height = 240) => {
  const ink = new Uint8Array(width * height)
  const slope = Math.tan((degrees * Math.PI) / 180)
  for (let rule = 20; rule < height - 20; rule += 18) {
    for (let x = 0; x < width; x += 1) {
      const y = Math.round(rule + x * slope)
      if (y >= 0 && y < height) ink[y * width + x] = 1
    }
  }
  return { ink, width, height }
}

describe('findSkewAngle', () => {
  it.each([2.4, -3, 1, 0])('рівняє лінії, нахилені на %d°', (degrees) => {
    const { ink, width, height } = tiltedRules(degrees)

    // Levelling turns the other way, within one search step.
    expect(findSkewAngle(ink, width, height)).toBeCloseTo(-degrees, 0)
  })

  it('порожнє фото — без повороту', () => {
    expect(findSkewAngle(new Uint8Array(100), 10, 10)).toBe(0)
  })
})

describe('inkMask', () => {
  it('чорнило — лише те, що помітно темніше за свій фон', () => {
    // A dark desk (60 on 60) is not ink; text on paper (90 on 230) is.
    expect(Array.from(inkMask([60, 90, 225], [60, 230, 230], 3))).toEqual([
      0, 1, 0,
    ])
  })
})
