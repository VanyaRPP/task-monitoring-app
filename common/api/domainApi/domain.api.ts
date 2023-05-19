import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  AllDomainQuery,
  IDomain,
  IExtendedDomain,
  IDeleteDomainResponse,
  IAddDomainResponse,
  IGetDomainResponse,
} from './domain.api.types'

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
    getDomains: builder.query<
      IExtendedDomain[],
      { limit?: number; domainId?: string; streetId?: string }
    >({
      query: ({ limit, domainId, streetId }) => {
        return {
          url: `domain`,
          params: { limit, domainId, streetId },
        }
      },
      providesTags: (response) =>
        response
          ? response.map((item) => ({ type: 'Domain', id: item._id }))
          : [],
      transformResponse: (response: IGetDomainResponse) => response.data,
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
    deleteDomain: builder.mutation<
      IDeleteDomainResponse,
      IExtendedDomain['_id']
    >({
      query(id) {
        return {
          url: `domain/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: (response) => (response ? ['Domain'] : []),
    }),
  }),
})

export const {
  useGetDomainsQuery,
  useAddDomainMutation,
  useDeleteDomainMutation,
} = domainApi
