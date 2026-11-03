/**
 * Levels a photo of a table before it is read.
 *
 * On a tilted sheet the right half of every row sits higher (or lower) than
 * the left, and a model reads a stretch of rows with their payments and
 * closing one row off. Straightening the photo first fixed it on every tilted
 * test sheet (53 wrong cells → 0). Perspective and a bent page are not
 * rotations and stay; the statement checks catch what they cause.
 */

/** How far a photo is searched for tilt, and in what steps, degrees. */
const MAX_TILT = 6
const TILT_STEP = 0.2
/** Below this the photo is left as it is: re-encoding costs more than it gives. */
export const MIN_TILT = 0.3
/** Width the photo is measured at - enough for table lines, cheap to scan. */
const MEASURE_WIDTH = 500
/** A pixel counts as ink when it is this much darker than its surroundings. */
const INK_CONTRAST = 35

/**
 * The rotation that levels the ink, in degrees, canvas convention (positive
 * turns clockwise).
 *
 * Every ink pixel is projected onto the vertical axis at each candidate
 * angle; at the right one, the table's rules and text lines stack into sharp
 * peaks, so the histogram changes most from one bin to the next.
 */
export const findSkewAngle = (
  ink: Uint8Array,
  width: number,
  height: number
): number => {
  const xs: number[] = []
  const ys: number[] = []
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (ink[y * width + x]) {
        xs.push(x)
        ys.push(y)
      }
    }
  }
  if (xs.length === 0) return 0

  const offset = Math.ceil(width * Math.sin((MAX_TILT * Math.PI) / 180)) + 1
  const bins = new Float64Array(height + 2 * offset + 1)
  let best = 0
  let bestScore = -1

  for (
    let step = -MAX_TILT / TILT_STEP;
    step <= MAX_TILT / TILT_STEP;
    step += 1
  ) {
    const angle = step * TILT_STEP
    const radians = (angle * Math.PI) / 180
    const sin = Math.sin(radians)
    const cos = Math.cos(radians)
    bins.fill(0)
    for (let i = 0; i < xs.length; i += 1) {
      bins[Math.round(xs[i] * sin + ys[i] * cos) + offset] += 1
    }

    let score = 0
    for (let i = 1; i < bins.length; i += 1) {
      const change = bins[i] - bins[i - 1]
      score += change * change
    }
    if (score > bestScore) {
      bestScore = score
      best = angle
    }
  }

  return Math.round(best * 100) / 100
}

/**
 * Ink as a mask: pixels clearly darker than their neighbourhood. A fixed
 * threshold would take a dark desk or a shadow for ink; a local one sees
 * only lines and text.
 */
export const inkMask = (
  gray: Uint8ClampedArray | number[],
  background: Uint8ClampedArray | number[],
  size: number
): Uint8Array => {
  const ink = new Uint8Array(size)
  for (let i = 0; i < size; i += 1) {
    ink[i] = gray[i] < background[i] - INK_CONTRAST ? 1 : 0
  }
  return ink
}

const grayOf = (context: CanvasRenderingContext2D, w: number, h: number) => {
  const { data } = context.getImageData(0, 0, w, h)
  const gray = new Uint8ClampedArray(w * h)
  for (let i = 0; i < w * h; i += 1) {
    gray[i] =
      data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114
  }
  return gray
}

/** The photo's tilt, measured on a small copy. */
export const measureTilt = (source: HTMLCanvasElement): number => {
  const width = MEASURE_WIDTH
  const height = Math.max(1, Math.round((source.height * width) / source.width))

  const small = document.createElement('canvas')
  small.width = width
  small.height = height
  const context = small.getContext('2d', { willReadFrequently: true })
  if (!context) return 0
  context.drawImage(source, 0, 0, width, height)
  const gray = grayOf(context, width, height)

  // The neighbourhood: the same picture shrunk 8 times and blown back up.
  const coarse = document.createElement('canvas')
  coarse.width = Math.max(1, Math.round(width / 8))
  coarse.height = Math.max(1, Math.round(height / 8))
  coarse.getContext('2d')?.drawImage(small, 0, 0, coarse.width, coarse.height)
  context.drawImage(coarse, 0, 0, width, height)
  const background = grayOf(context, width, height)

  return findSkewAngle(inkMask(gray, background, width * height), width, height)
}

/** The photo turned level, or the same canvas when it already is. */
export const deskew = (source: HTMLCanvasElement): HTMLCanvasElement => {
  const angle = measureTilt(source)
  if (Math.abs(angle) < MIN_TILT) return source

  const radians = (angle * Math.PI) / 180
  const sin = Math.abs(Math.sin(radians))
  const cos = Math.abs(Math.cos(radians))
  const turned = document.createElement('canvas')
  turned.width = Math.round(source.width * cos + source.height * sin)
  turned.height = Math.round(source.width * sin + source.height * cos)

  const context = turned.getContext('2d')
  if (!context) return source
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, turned.width, turned.height)
  context.translate(turned.width / 2, turned.height / 2)
  context.rotate(radians)
  context.drawImage(source, -source.width / 2, -source.height / 2)

  return turned
}
