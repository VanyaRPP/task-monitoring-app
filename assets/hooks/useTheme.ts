import { useEffect } from 'react'

function useTheme(theme) {
  useEffect(() => {
    for (const key in theme) {
      document.documentElement.style.setProperty(`--${key}`, theme[key])
    }
  }, [theme])
}

export default useTheme
