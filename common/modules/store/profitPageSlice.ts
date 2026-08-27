// store/slices/profitPageSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface ProfitState {
  activeTabKey: string
  transactionTablePagination: {
    currentPage: number
    pageSize: number
  }
}

const initialState: ProfitState = {
  activeTabKey: 'tab1',
  transactionTablePagination: {
    currentPage: 1,
    // months per page, not records
    pageSize: 12,
  },
}

const profitPageSlice = createSlice({
  name: 'profit',
  initialState,
  reducers: {
    setActiveTabKey: (state, action: PayloadAction<string>) => {
      state.activeTabKey = action.payload
    },
    setTransactionTablePagination: (
      state,
      action: PayloadAction<{ currentPage: number; pageSize?: number }>
    ) => {
      state.transactionTablePagination.currentPage = action.payload.currentPage
      if (action.payload.pageSize) {
        state.transactionTablePagination.pageSize = action.payload.pageSize
      }
    },
  },
})

export const { setActiveTabKey, setTransactionTablePagination } =
  profitPageSlice.actions
export default profitPageSlice.reducer
