import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { IPaymentFilterResponse } from './filter.api.types'

export const filterApi = createApi({
  reducerPath: 'filterApi',
  tagTypes: ['Filter', 'IFilter'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/filter/` }),
  endpoints: (builder) => ({
    getDomainFilters: builder.query<IPaymentFilterResponse, void>({
      query: () => {
        return {
          url: `payments`,
          method: 'GET',
        }
      },
      providesTags: (response) =>
        response
          ? [
              { type: 'Filter', id: 'domainsFilter' },
              { type: 'Filter', id: 'realEstatesFilter' },
              { type: 'Filter', id: 'addressFilter' },
            ]
          : [],
    }),

    getDateFilters: builder.query<IPaymentFilterResponse, void>({
      query: () => {
        return {
          url: 'date',
          method: 'GET',
        }
      },

      providesTags: (response) =>
        response
          ? [
              { type: 'Filter', id: 'yearFilter' },
              { type: 'Filter', id: 'monthFilter' },
            ]
          : [],
    }),
    getRealEstateFilters: builder.query<IPaymentFilterResponse, void>({
      query: () => {
        return {
          url: 'real-estate',
          method: 'GET',
        }
      },
      providesTags: (response) =>
        response
          ? [
              { type: 'Filter', id: 'domainsFilter' },
              { type: 'Filter', id: 'realEstatesFilter' },
              { type: 'Filter', id: 'streetsFilter' },
            ]
          : [],
    }),
  }),
})

export const {
  useGetDomainFiltersQuery,
  useGetDateFiltersQuery,
  useGetRealEstateFiltersQuery,
} = filterApi
