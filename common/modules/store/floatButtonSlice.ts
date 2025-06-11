import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { FloatButtonItem } from '@utils/types'

interface FloatButtonState {
  buttons: FloatButtonItem[]
}

const initialState: FloatButtonState = {
  buttons: [],
}

const floatButtonSlice = createSlice({
  name: 'floatButtons',
  initialState,
  reducers: {
    setButtons(state, action: PayloadAction<FloatButtonItem[]>) {
      state.buttons = action.payload
    },
    addButton(state, action: PayloadAction<FloatButtonItem>) {
      const btn = action.payload
      state.buttons = [...state.buttons.filter((b) => b.key !== btn.key), btn]
    },
    removeButton(state, action: PayloadAction<string>) {
      state.buttons = state.buttons.filter((btn) => btn.key !== action.payload)
    },
    clearButtons(state) {
      state.buttons = []
    },
  },
})

export const { setButtons, addButton, removeButton, clearButtons } =
  floatButtonSlice.actions
export default floatButtonSlice.reducer
