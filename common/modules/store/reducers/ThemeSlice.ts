import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { COLOR_THEME } from '@utils/constants'

interface ThemeState {
  theme: string
}

const initialState: ThemeState = {
  theme: COLOR_THEME.LIGHT,
}

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    changeTheme(state, action: PayloadAction<string>) {
      state.theme = action.payload
    },
  },
})

export default themeSlice.reducer
