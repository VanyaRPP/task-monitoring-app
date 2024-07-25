import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface SidebarState {
  collapsed: boolean
}

const initialState: SidebarState = {
  collapsed: false,
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
  },
})

export const { toggleCollapse, setCollapse } = collapseSlice.actions

export default collapseSlice.reducer
