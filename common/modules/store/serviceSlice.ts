import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Draft } from 'immer'
import { IStreet } from '@common/api/streetApi/street.api.types'

interface StreetsState {
  currentPage: number
  pageSize: number
  filters?: Record<string, any>
  streetsData: IStreet[]
  totalCount: number
}

const initialState: StreetsState = {
  currentPage: 1,
  pageSize: 10,
  filters: undefined,
  streetsData: [],
  totalCount: 0,
}

const streetsSlice = createSlice({
  name: 'streets',
  initialState,
  reducers: {
    setPage(state, action: PayloadAction<{ page: number; pageSize?: number }>) {
      state.currentPage = action.payload.page
      if (action.payload.pageSize != null) {
        state.pageSize = action.payload.pageSize
      }
    },
    setFilters(state, action: PayloadAction<Record<string, any> | undefined>) {
      state.filters = action.payload
    },
    setStreetsData(
      state: Draft<StreetsState>,
      action: PayloadAction<{ data: IStreet[]; totalCount: number }>
    ) {
      state.streetsData = action.payload.data
      state.totalCount = action.payload.totalCount
    },
  },
})

export const { setPage, setFilters, setStreetsData } = streetsSlice.actions
export default streetsSlice.reducer
