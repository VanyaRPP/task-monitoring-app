import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface ThemeState {
  theme: string
}

const initialState: ThemeState = {
  theme: 'light',
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
