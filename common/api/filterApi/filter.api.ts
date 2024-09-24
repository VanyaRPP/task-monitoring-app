import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { IPaymentFilterResponse } from './filter.api.types'

export const filterApi = createApi({
  reducerPath: 'filterApi',
  tagTypes: ['Filter', 'IFilter'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/filter/` }),
  endpoints: (builder) => ({
    getDomains: builder.query<IPaymentFilterResponse, {}>({
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
    getService: builder.query<IPaymentFilterResponse, {}>({
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
    getRealEstate: builder.query<IPaymentFilterResponse, {}>({
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

export const { useGetDomainsQuery, useGetServiceQuery, useGetRealEstateQuery } =
  filterApi
