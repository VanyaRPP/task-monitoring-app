import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { AllDomainQuery, IDomain } from './domain.api.types'

export const domainApi = createApi({
  reducerPath: 'domainApi',
  tagTypes: ['Domain', 'IDomain'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    // TODO: fix and add typisation
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    getDomains: builder.query<any>({
      query: () => {
        return {
          url: `domain`,
        }
      },
      providesTags: (response) =>
        response
          ? response.map((item) => ({ type: 'Domain', id: item._id }))
          : [],
      transformResponse: (response: AllDomainQuery) => response.data,
    }),
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

export const { useGetDomainsQuery, useAddDomainMutation } = domainApi
