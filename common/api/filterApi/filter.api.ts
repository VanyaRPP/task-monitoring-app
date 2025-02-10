import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { IPaymentFilterResponse } from './filter.api.types'

export const filterApi = createApi({
  reducerPath: 'filterApi',
  tagTypes: ['Filter', 'IFilter'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/filter/` }),
  endpoints: (builder) => ({
    getDomainFilters: builder.query<
      IPaymentFilterResponse,
      { streets?: any; realEstates?: any }
    >({
      query: ({ streets, realEstates }) => {
        return {
          url: `domain`,
          method: 'GET',
          params: { streets, realEstates },
        }
      },
      providesTags: (response) =>
        response ? [{ type: 'Filter', id: 'domainsFilter' }] : [],
    }),

    getAddressFilters: builder.query<
      IPaymentFilterResponse,
      { realEstates?: any; domains?: any }
    >({
      query: ({ realEstates, domains }) => {
        return {
          url: `street`,
          method: 'GET',
          params: { realEstates, domains },
        }
      },
      providesTags: (response) =>
        response ? [{ type: 'Filter', id: 'streetsFilter' }] : [],
    }),

    getDateFilters: builder.query<
      IPaymentFilterResponse,
      { type?: 'service' | 'payment' }
    >({
      query: (params) => {
        return {
          url: 'date',
          method: 'GET',
          params,
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
    getRealEstateFilters: builder.query<
      IPaymentFilterResponse,
      { streets?: any; domains?: any }
    >({
      query: ({ streets, domains }) => {
        return {
          url: `real-estate`,
          method: 'GET',
          params: { streets, domains },
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
