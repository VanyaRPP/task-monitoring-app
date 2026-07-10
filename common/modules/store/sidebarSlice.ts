import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface SidebarState {
  collapsed: boolean
  forcedOpenKeys: string[]
}

const initialState: SidebarState = {
  collapsed: false,
  forcedOpenKeys: [],
}

const collapseSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleCollapse: (state) => {
      state.collapsed = !state.collapsed
    },
    setCollapse: (state, action: PayloadAction<boolean>) => {
      state.collapsed = action.payload
    },
    setForcedOpenKeys: (state, action: PayloadAction<string[]>) => {
      state.forcedOpenKeys = action.payload
    },
    clearForcedOpenKeys: (state) => {
      state.forcedOpenKeys = []
    },
  },
})

export const {
  toggleCollapse,
  setCollapse,
  setForcedOpenKeys,
  clearForcedOpenKeys,
} = collapseSlice.actions

export default collapseSlice.reducer
