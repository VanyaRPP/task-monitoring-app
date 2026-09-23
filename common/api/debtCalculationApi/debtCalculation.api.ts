import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  IDebtCalculationListResponse,
  IDebtCalculationResponse,
  ISaveDebtCalculationRequest,
  ISavedDebtCalculation,
} from './debtCalculation.api.types'

export const debtCalculationApi = createApi({
  reducerPath: 'debtCalculationApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['DebtCalculation'],
  endpoints: (builder) => ({
    getDebtCalculations: builder.query<
      ISavedDebtCalculation[],
      { domainId?: string } | undefined
    >({
      query: (args) => ({
        url: 'debt-calculation',
        params: args?.domainId ? { domainId: args.domainId } : {},
      }),
      transformResponse: (response: IDebtCalculationListResponse) =>
        response.data,
      providesTags: ['DebtCalculation'],
    }),

    saveDebtCalculation: builder.mutation<
      ISavedDebtCalculation,
      ISaveDebtCalculationRequest
    >({
      query: ({ _id, ...body }) => ({
        url: _id ? `debt-calculation/${_id}` : 'debt-calculation',
        method: _id ? 'PATCH' : 'POST',
        body,
      }),
      transformResponse: (response: IDebtCalculationResponse) => response.data,
      invalidatesTags: ['DebtCalculation'],
    }),

    deleteDebtCalculation: builder.mutation<string, string>({
      query: (id) => ({ url: `debt-calculation/${id}`, method: 'DELETE' }),
      transformResponse: (response: { success: boolean; data: string }) =>
        response.data,
      invalidatesTags: ['DebtCalculation'],
    }),
  }),
})

export const {
  useGetDebtCalculationsQuery,
  useSaveDebtCalculationMutation,
  useDeleteDebtCalculationMutation,
} = debtCalculationApi
