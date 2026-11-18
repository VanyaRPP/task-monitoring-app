import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { IBuildingTariffs } from '@utils/debt-calculation/building-tariffs'
import {
  IDebtCalculationKey,
  IDebtCalculationResponse,
  IImportDebtCalculationRequest,
  IReadTariffsPdfRequest,
  IReadTariffsPdfResult,
  ISaveBuildingTariffsRequest,
  ISaveDebtCalculationRequest,
  ISavedDebtCalculation,
} from './debtCalculation.api.types'

export const debtCalculationApi = createApi({
  reducerPath: 'debtCalculationApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['DebtCalculation', 'BuildingTariffs'],
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

    getBuildingTariffs: builder.query<IBuildingTariffs[], string>({
      query: (domainId) => ({
        url: 'debt-calculation/tariffs',
        params: { domainId },
      }),
      transformResponse: (response: { data: IBuildingTariffs[] }) =>
        response.data ?? [],
      providesTags: ['BuildingTariffs'],
    }),

    saveBuildingTariffs: builder.mutation<
      IBuildingTariffs[],
      ISaveBuildingTariffsRequest
    >({
      query: (body) => ({
        url: 'debt-calculation/tariffs',
        method: 'PUT',
        body,
      }),
      transformResponse: (response: { data: IBuildingTariffs[] }) =>
        response.data ?? [],
      invalidatesTags: ['BuildingTariffs'],
    }),

    readTariffsPdf: builder.mutation<
      IReadTariffsPdfResult,
      IReadTariffsPdfRequest
    >({
      query: (body) => ({
        url: 'debt-calculation/tariffs/read',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: IReadTariffsPdfResult }) =>
        response.data,
    }),
  }),
})

export const {
  useGetDebtCalculationQuery,
  useSaveDebtCalculationMutation,
  useImportDebtCalculationMutation,
  useGetBuildingTariffsQuery,
  useSaveBuildingTariffsMutation,
  useReadTariffsPdfMutation,
} = debtCalculationApi
