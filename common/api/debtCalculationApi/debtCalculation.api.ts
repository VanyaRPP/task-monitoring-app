import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  IDebtCalculationKey,
  IDebtCalculationResponse,
  IImportDebtCalculationRequest,
  ISaveDebtCalculationRequest,
  ISavedDebtCalculation,
} from './debtCalculation.api.types'

export const debtCalculationApi = createApi({
  reducerPath: 'debtCalculationApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['DebtCalculation'],
  endpoints: (builder) => ({
    getDebtCalculation: builder.query<
      ISavedDebtCalculation | null,
      IDebtCalculationKey
    >({
      query: ({ domainId, companyId }) => ({
        url: 'debt-calculation',
        params: { domainId, companyId },
      }),
      transformResponse: (response: IDebtCalculationResponse) => response.data,
      providesTags: ['DebtCalculation'],
    }),

    saveDebtCalculation: builder.mutation<
      ISavedDebtCalculation | null,
      ISaveDebtCalculationRequest
    >({
      query: (body) => ({ url: 'debt-calculation', method: 'POST', body }),
      transformResponse: (response: IDebtCalculationResponse) => response.data,
      // Deliberately WITHOUT invalidatesTags: autosave fires on every pause in
      // typing, and a refetch would pull what was just sent back into the form,
      // clobbering whatever the user is typing next.
    }),

    importDebtCalculation: builder.mutation<
      ISavedDebtCalculation | null,
      IImportDebtCalculationRequest
    >({
      query: (body) => ({
        url: 'debt-calculation/import',
        method: 'POST',
        body,
      }),
      transformResponse: (response: IDebtCalculationResponse) => response.data,
      // Unlike autosave, an import comes from outside the page, so an open
      // page has to pick it up.
      invalidatesTags: ['DebtCalculation'],
    }),
  }),
})

export const {
  useGetDebtCalculationQuery,
  useSaveDebtCalculationMutation,
  useImportDebtCalculationMutation,
} = debtCalculationApi
