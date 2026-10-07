import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  IInflationIndex,
  IInflationIndexInput,
  IInflationIndexRange,
  IInflationIndexResponse,
} from './inflationIndex.api.types'

export const inflationIndexApi = createApi({
  reducerPath: 'inflationIndexApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['InflationIndex'],
  endpoints: (builder) => ({
    getInflationIndexes: builder.query<
      IInflationIndex[],
      IInflationIndexRange | undefined
    >({
      query: (range) => {
        const params = new URLSearchParams()
        if (range?.from) params.set('from', range.from)
        if (range?.to) params.set('to', range.to)
        const qs = params.toString()

        return `inflation-index${qs ? `?${qs}` : ''}`
      },
      transformResponse: (response: IInflationIndexResponse) => response.data,
      providesTags: ['InflationIndex'],
    }),

    saveInflationIndexes: builder.mutation<
      IInflationIndex[],
      IInflationIndexInput[]
    >({
      query: (items) => ({
        url: 'inflation-index',
        method: 'POST',
        body: { items },
      }),
      transformResponse: (response: IInflationIndexResponse) => response.data,
      invalidatesTags: ['InflationIndex'],
    }),
  }),
})

export const { useGetInflationIndexesQuery, useSaveInflationIndexesMutation } =
  inflationIndexApi
