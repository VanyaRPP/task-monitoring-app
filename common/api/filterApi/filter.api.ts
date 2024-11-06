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
          url: `domain`,
          method: 'GET',
        }
      },
      providesTags: (response) =>
        response ? [{ type: 'Filter', id: 'domainsFilter' }] : [],
    }),

    getAddressFilters: builder.query<IPaymentFilterResponse, void>({
      query: () => {
        return {
          url: `street`,
          method: 'GET',
        }
      },
      providesTags: (response) =>
        response ? [{ type: 'Filter', id: 'streetsFilter' }] : [],
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
        response ? [{ type: 'Filter', id: 'realEstatesFilter' }] : [],
    }),
  }),
})

export const {
  useGetAddressFiltersQuery,
  useGetDateFiltersQuery,
  useGetDomainFiltersQuery,
  useGetRealEstateFiltersQuery,
} = filterApi
