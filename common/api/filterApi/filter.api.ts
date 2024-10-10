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
    getServiceFilters: builder.query<IPaymentFilterResponse, void>({
      query: () => {
        return {
          url: 'service',
          method: 'GET',
        }
      },

      providesTags: (response) =>
        response
          ? [
              { type: 'Filter', id: 'domainFilter' },
              { type: 'Filter', id: 'addressFilter' },
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
  useGetServiceFiltersQuery,
  useGetRealEstateFiltersQuery,
} = filterApi
