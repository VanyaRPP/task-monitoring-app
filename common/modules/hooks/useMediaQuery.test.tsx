import { expect } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'
import { useMediaQuery } from './useMediaQuery'

type Listener = () => void

const installMatchMedia = (initial: boolean) => {
  const listeners = new Set<Listener>()
  const list = {
    matches: initial,
    addEventListener: (_: string, listener: Listener) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: Listener) =>
      listeners.delete(listener),
  }
  const original = window.matchMedia
  window.matchMedia = jest.fn(() => list) as unknown as typeof window.matchMedia
  return {
    listeners,
    set: (matches: boolean) => {
      list.matches = matches
      listeners.forEach((listener) => listener())
    },
    restore: () => {
      window.matchMedia = original
    },
  }
}

describe('useMediaQuery', () => {
  it('reports whether the query matches', () => {
    const media = installMatchMedia(true)
    const { result } = renderHook(() => useMediaQuery('(min-width: 1360px)'))

    expect(result.current).toBe(true)
    media.restore()
  })

  it('follows the viewport as it changes', () => {
    const media = installMatchMedia(false)
    const { result } = renderHook(() => useMediaQuery('(min-width: 1360px)'))
    expect(result.current).toBe(false)

    act(() => media.set(true))
    expect(result.current).toBe(true)

    act(() => media.set(false))
    expect(result.current).toBe(false)
    media.restore()
  })

  it('stops listening once unmounted', () => {
    const media = installMatchMedia(false)
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 1360px)'))
    expect(media.listeners.size).toBe(1)

    unmount()
    expect(media.listeners.size).toBe(0)
    media.restore()
  })
})
