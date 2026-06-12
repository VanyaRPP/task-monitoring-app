import '@testing-library/jest-dom'
import '@testing-library/jest-dom/jest-globals'
import { configure } from '@testing-library/react'
import { TextEncoder, TextDecoder } from 'util'

configure({ asyncUtilTimeout: 5000 })

process.env.MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://test-placeholder/jest'
;(global as any).TextEncoder = TextEncoder
;(global as any).TextDecoder = TextDecoder

process.env.SUPPRESS_JEST_WARNINGS = 'true'

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
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
}
