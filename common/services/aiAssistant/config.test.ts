/**
 * @jest-environment node
 */
import { DEFAULT_PHOTO_MODEL, getPageReader } from './config'

const ENV = { ...process.env }

afterEach(() => {
  process.env = { ...ENV }
})

describe('getPageReader', () => {
  it('з ключем Google — Gemini Flash-Lite за замовчуванням', () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'key'
    delete process.env.GOOGLE_PHOTO_MODEL
    delete process.env.PHOTO_READER

    const reader = getPageReader()

    expect(DEFAULT_PHOTO_MODEL).toBe('gemini-3.5-flash-lite')
    expect(reader?.label).toBe('Google gemini-3.5-flash-lite')
    expect((reader?.model as any).modelId).toBe('gemini-3.5-flash-lite')
  })

  it('модель міняється змінною середовища', () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'key'
    process.env.GOOGLE_PHOTO_MODEL = 'gemini-3.8-flash'

    expect((getPageReader()?.model as any).modelId).toBe('gemini-3.8-flash')
  })

  it('без ключа або з PHOTO_READER=strips — немає (фото читаються смугами Groq)', () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
    expect(getPageReader()).toBeNull()

    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'key'
    process.env.PHOTO_READER = 'strips'
    expect(getPageReader()).toBeNull()
  })
})
