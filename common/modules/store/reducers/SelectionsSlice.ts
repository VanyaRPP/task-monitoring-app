import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface PaymentDeleteItem {
  id: string,
  date: string,
  domain: string,
  company: string,
}

interface SelectionsState {
  paymentsDeleteItems: PaymentDeleteItem[]
}

const initialState: SelectionsState = {
  paymentsDeleteItems: [],
}

export const selectionsSlice = createSlice({
  name: 'selections',
  initialState,
  reducers: {
    setPaymentsDeleteIds(state, action: PayloadAction<PaymentDeleteItem[]>) {
      state.paymentsDeleteItems = action.payload
    },
  },
})

export default selectionsSlice.reducer
