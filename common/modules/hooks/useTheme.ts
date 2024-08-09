import { RootState } from '@modules/store/store'
import { setTheme as _setTheme, Theme } from '@modules/store/themeSlice'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const getInitialTheme = (): Theme => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const useTheme = (): [Theme, (theme: Theme) => void] => {
  const theme = useSelector((state: RootState) => state.theme)
  const dispatch = useDispatch()

  const setTheme = useCallback(
    (theme: Theme) => {
      localStorage.setItem('theme', theme)
      dispatch(_setTheme(theme))
    },
    [dispatch]
  )

  useEffect(() => {
    const _theme = localStorage.getItem('theme') as Theme

    if (_theme) {
      dispatch(_setTheme(_theme))
    } else {
      setTheme(getInitialTheme())
    }
  }, [dispatch, setTheme])

  return [theme, setTheme]
}

export default useTheme
