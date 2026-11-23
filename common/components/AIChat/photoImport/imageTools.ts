import type { FileUIPart } from 'ai'
import { deskew } from './deskew'

/**
 * Long side of the photo that is sent. A table of ~20 rows reads cleanly at
 * 1600px; 2000 leaves headroom for a full A4 page shot from a distance, and
 * still makes a JPEG of a few hundred KB - well inside the 4mb request limit.
 */
const MAX_SIDE = 2000
const JPEG_QUALITY = 0.85

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Не вдалося відкрити зображення'))
    }
    image.src = url
  })

/**
 * Turns a picked photo into a chat file part: scaled down, re-encoded as JPEG.
 *
 * Phones hand over 5-12 MB originals, sometimes HEIC; drawing through a
 * canvas fixes both - the size, and the format (the browser decodes what it
 * can display, the canvas always writes JPEG). EXIF rotation is applied by
 * the browser when the image is drawn. A tilted photo is levelled (see
 * `deskew`) - the chat shows and the model reads the straightened one.
 */
export async function shrinkImage(file: File): Promise<FileUIPart> {
  const image = await loadImage(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height))
  const width = Math.round(image.width * scale)
  const height = Math.round(image.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Не вдалося обробити зображення')

  // JPEG has no alpha: a transparent screenshot would turn black without this.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  return {
    type: 'file',
    mediaType: 'image/jpeg',
    filename: file.name.replace(/\.[^.]+$/, '') + '.jpg',
    url: deskew(canvas).toDataURL('image/jpeg', JPEG_QUALITY),
  }
}

/**
 * Long side a strip is scaled to. The model sees every image at a fixed token
 * cost, so blowing a thin strip up gives each row more pixels - on a real
 * 960px phone photo this is what kept the digits readable.
 */
const STRIP_LONG_SIDE = 2000
const MAX_STRIP_UPSCALE = 3
const STRIP_QUALITY = 0.9

/**
 * Cuts a horizontal strip out of a photo (`top`/`bottom` are fractions of its
 * height), enlarged, as a JPEG data URL.
 */
export async function cropStrip(
  url: string,
  { top, bottom }: { top: number; bottom: number }
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('Не вдалося відкрити зображення'))
    element.src = url
  })

  const sourceTop = Math.floor(image.height * top)
  const sourceHeight = Math.max(
    1,
    Math.min(image.height - sourceTop, Math.ceil(image.height * (bottom - top)))
  )
  const scale = Math.min(
    MAX_STRIP_UPSCALE,
    STRIP_LONG_SIDE / Math.max(image.width, sourceHeight)
  )

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(sourceHeight * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Не вдалося обробити зображення')

  context.imageSmoothingQuality = 'high'
  context.drawImage(
    image,
    0,
    sourceTop,
    image.width,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  )

  return canvas.toDataURL('image/jpeg', STRIP_QUALITY)
}
