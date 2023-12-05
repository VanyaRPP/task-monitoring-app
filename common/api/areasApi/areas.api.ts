import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { IGetAreasResponse, IExtendedAreas } from './areas.api.types'

export const areasApi = createApi({
  reducerPath: 'areasApi',
  tagTypes: ['Areas'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
  }),
  endpoints: (builder) => ({
    getAreas: builder.query<IExtendedAreas, { domainId?: string }>({
      query: ({ domainId }) => ({
        url: `domain/areas/${domainId}`,
        method: 'GET',
      }),
      providesTags: (result, error, { domainId }) => [
        { type: 'Areas', id: domainId },
      ],
      transformResponse: (response: IGetAreasResponse) => response.data,
    }),
  }),
})

export const { useGetAreasQuery } = areasApi
