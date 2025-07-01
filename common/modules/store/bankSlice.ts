// store/slices/bankSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface BankState {
  activeDomainId: string | null
  account: string | null
}

const initialState: BankState = {
  activeDomainId: null,
  account: null,
}

const bankSlice = createSlice({
  name: 'bank',
  initialState,
  reducers: {
    setActiveDomainId: (state, action: PayloadAction<string>) => {
      state.activeDomainId = action.payload
    },
    setAccount: (state, action: PayloadAction<string | null>) => {
      state.account = action.payload
    },
    resetAccount: (state) => {
      state.account = null
    },
  },
})

export const { setActiveDomainId, setAccount, resetAccount } = bankSlice.actions
export default bankSlice.reducer
