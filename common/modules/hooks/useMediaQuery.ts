import { useEffect, useState } from 'react'

/**
 * Whether a CSS media query matches, kept up to date as the viewport changes.
 * False on the server and on the first client render, so markup that depends
 * on it must be fine to appear a frame late.
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const list = window.matchMedia(query)
    const update = () => setMatches(list.matches)

    update()
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [query])

  return matches
}

export default useMediaQuery
