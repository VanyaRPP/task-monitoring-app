import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { IDomain } from './domain.api.types'

export const domainApi = createApi({
  reducerPath: 'domainApi',
  tagTypes: ['Domain', 'IDomain'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    addDomain: builder.mutation<IDomain, Partial<IDomain>>({
      query(data) {
        const { ...body } = data
        return {
          url: 'domain',
          method: 'POST',
          body,
        }
      },
      invalidatesTags: ['Domain'],
    }),
  }),
})

export const { useAddDomainMutation } = domainApi
