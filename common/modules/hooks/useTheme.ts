import { RootState } from '@modules/store/store'
import { setTheme as _setTheme, Theme } from '@modules/store/themeSlice'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const useTheme = (): [Theme, (theme: Theme) => void] => {
  const theme = useSelector((state: RootState) => state.theme)
  const dispatch = useDispatch()

  const setTheme = useCallback(
    (theme: Theme) => dispatch(_setTheme(theme)),
    [dispatch]
  )

  return [theme, setTheme]
}

export default useTheme
