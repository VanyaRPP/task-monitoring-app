import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { FloatButtonItem } from '@utils/types'

interface FloatButtonState {
  buttons: FloatButtonItem[]
  menuOffset: number
}

const initialState: FloatButtonState = {
  buttons: [],
  menuOffset: 0,
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
    setMenuOffset(state, action: PayloadAction<number>) {
      if (state.menuOffset !== action.payload) {
        state.menuOffset = action.payload
      }
    },
  },
})

export const {
  setButtons,
  addButton,
  removeButton,
  clearButtons,
  setMenuOffset,
} = floatButtonSlice.actions
export default floatButtonSlice.reducer
