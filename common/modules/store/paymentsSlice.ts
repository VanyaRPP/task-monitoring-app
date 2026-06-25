import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Draft } from 'immer'
import { IFilter } from '@common/api/filterApi/filter.api.types'
import { IPaymentFilterResponse } from '@common/api/filterApi/filter.api.types'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { AppRoutes, Operations, ServiceType, Roles } from '@utils/constants'
import { PaymentDeleteItem } from '@components/Tables/Payment/Header'

type DebtPerMonth = {
  monthService: string
  totalDue: number
  paid: number
  remaining: number
}
type CompanyWithPayments = {
  companyId: any
  companyName: string
  debtPerMonth: DebtPerMonth[]
  totalDebt: number
}

interface PaymentsState {
  currentPage: number
  pageSize: number
  filters?: Record<string, any>
  domainsFilter: IFilter[]
  companiesFilter: IFilter[]
  streetsFilter: IFilter[]
  dateFilters?: IPaymentFilterResponse
  currentPayment: Draft<Partial<IExtendedPayment>> | null
  edit: boolean
  preview: boolean
  debtorCompanies: CompanyWithPayments[]
  selectedColumns: ServiceType[]
  paymentsDeleteItems: PaymentDeleteItem[]
  selectedPayments: IExtendedPayment[]
  selectedDateField: 'invoiceCreationDate' | 'date'
}

const initialState: PaymentsState = {
  currentPage: 0,
  pageSize: 0,
  filters: undefined,
  domainsFilter: [],
  companiesFilter: [],
  streetsFilter: [],
  dateFilters: undefined,
  currentPayment: null,
  edit: false,
  preview: false,
  debtorCompanies: [],
  selectedColumns: [],
  paymentsDeleteItems: [],
  selectedPayments: [],
  selectedDateField: 'invoiceCreationDate',
}

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    setPage(state, action: PayloadAction<{ page: number; pageSize?: number }>) {
      state.currentPage = action.payload.page
      if (action.payload.pageSize != null) {
        state.pageSize = action.payload.pageSize
      }
    },
    setFilters(state, action: PayloadAction<Record<string, any> | undefined>) {
      state.currentPage = 1
      state.filters = action.payload
    },
    setDomainsFilter(state, action: PayloadAction<IFilter[]>) {
      state.domainsFilter = action.payload
    },
    setCompaniesFilter(state, action: PayloadAction<IFilter[]>) {
      state.companiesFilter = action.payload
    },
    setStreetsFilter(state, action: PayloadAction<IFilter[]>) {
      state.streetsFilter = action.payload
    },
    setDateFilters(
      state,
      action: PayloadAction<IPaymentFilterResponse | undefined>
    ) {
      state.dateFilters = action.payload
    },
    setOpenView(
      state: Draft<PaymentsState>,
      action: PayloadAction<Draft<Partial<IExtendedPayment>>>
    ) {
      state.currentPayment = action.payload
      state.edit = false
      state.preview = true
    },
    setOpenEdit(
      state: Draft<PaymentsState>,
      action: PayloadAction<Draft<Partial<IExtendedPayment>>>
    ) {
      state.currentPayment = action.payload
      state.edit = true
      state.preview = false
    },
    setCloseModal(state) {
      state.currentPayment = null
      state.edit = false
      state.preview = false
    },
    setDebtorCompanies(state, action: PayloadAction<CompanyWithPayments[]>) {
      state.debtorCompanies = action.payload
    },
    setSelectedColumns(state, action: PayloadAction<ServiceType[]>) {
      state.selectedColumns = action.payload
    },
    setPaymentsDeleteItems(
      state: Draft<PaymentsState>,
      action: PayloadAction<PaymentDeleteItem[]>
    ) {
      state.paymentsDeleteItems = action.payload
    },

    setSelectedPayments(
      state: Draft<PaymentsState>,
      action: PayloadAction<IExtendedPayment[]>
    ) {
      state.selectedPayments = action.payload as Draft<IExtendedPayment[]>
    },

    setSelectedDateField(
      state: Draft<PaymentsState>,
      action: PayloadAction<'invoiceCreationDate' | 'date'>
    ) {
      state.selectedDateField = action.payload
    },
  },
})

export const {
  setPage,
  setFilters,
  setDomainsFilter,
  setCompaniesFilter,
  setStreetsFilter,
  setDateFilters,
  setOpenView,
  setOpenEdit,
  setCloseModal,
  setDebtorCompanies,
  setSelectedColumns,
  setPaymentsDeleteItems,
  setSelectedPayments,
  setSelectedDateField,
} = paymentsSlice.actions

export default paymentsSlice.reducer
