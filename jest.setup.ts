import '@testing-library/jest-dom'
import '@testing-library/jest-dom/jest-globals'
import { configure } from '@testing-library/react'
import { TextEncoder, TextDecoder } from 'util'

configure({ asyncUtilTimeout: 5000 })

process.env.MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://test-placeholder/jest'
;(global as any).TextEncoder = TextEncoder
;(global as any).TextDecoder = TextDecoder
if (typeof global.fetch === 'undefined') {
  ;(global as any).fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    })
  ) as unknown as typeof fetch
}

if (typeof global.Request === 'undefined') {
  const { Request, Response, Headers } = require('node-fetch')
  ;(global as any).Request = Request
  ;(global as any).Response = Response
  ;(global as any).Headers = Headers
}
process.env.SUPPRESS_JEST_WARNINGS = 'true'

if (typeof window !== 'undefined') {
  // antd v5 injects vendor pseudo-element rules (e.g. `::-moz-placeholder`,
  // `::-ms-reveal`) wrapped in `:where(...)`. The nwsapi build bundled with our
  // jsdom can't parse those selectors and throws "is not a valid selector"
  // while `getComputedStyle` scans the stylesheets — which crashes any
  // `*ByRole` query run against a placeholder input inside a Form. Only the
  // throwing path is stubbed; normal style computation is left untouched, so no
  // assertion can be silently masked.
  const rawGetComputedStyle = window.getComputedStyle.bind(window)
  window.getComputedStyle = function patchedGetComputedStyle(
    element: Element,
    pseudoElement?: string | null
  ): CSSStyleDeclaration {
    try {
      return rawGetComputedStyle(element, pseudoElement ?? undefined)
    } catch {
      return new Proxy({} as CSSStyleDeclaration, {
        get(_target, prop) {
          if (prop === 'getPropertyValue') return () => ''
          return ''
        },
      })
    }
  } as typeof window.getComputedStyle

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
