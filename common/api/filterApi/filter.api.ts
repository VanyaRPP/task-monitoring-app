import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { IPaymentFilterResponse } from './filter.api.types'

function cleanParams(params: Record<string, any>) {
  const cleaned: Record<string, any> = {}
  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== null &&
      value !== undefined &&
      !(Array.isArray(value) && value.length === 0) &&
      value !== ''
    ) {
      cleaned[key] = value
    }
  })
  return cleaned
}

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
          params: cleanParams({ streets, realEstates }),
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
          params: cleanParams({ realEstates, domains }),
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
          params: cleanParams(params),
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
          params: cleanParams({ streets, domains }),
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
