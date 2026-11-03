import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Tracks whether an element's content overflows its own box
 * (`scrollWidth > clientWidth`), so truncation-related UI (e.g. a tooltip)
 * can react to the actual available width instead of a fixed character count.
 */
export function useIsTruncated<T extends HTMLElement = HTMLElement>(
  deps: unknown[] = []
): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  useLayoutEffect(() => {
    const check = () => {
      const el = ref.current
      if (el) setIsTruncated(el.scrollWidth > el.clientWidth)
    }

    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return [ref, isTruncated]
}
