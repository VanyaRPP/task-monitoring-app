import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

process.env.MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://test-placeholder/jest'

;(global as any).TextEncoder = TextEncoder
;(global as any).TextDecoder = TextDecoder

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})