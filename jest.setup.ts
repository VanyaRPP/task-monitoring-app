import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

;(global as any).TextEncoder = TextEncoder
;(global as any).TextDecoder = TextDecoder

process.env.SUPPRESS_JEST_WARNINGS = 'true'

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