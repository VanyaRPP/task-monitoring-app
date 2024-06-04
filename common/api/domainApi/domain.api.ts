import { IDomain } from '@common/modules/models/Domain'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { toCleanObject } from '@utils/toCleanObject'
import {
  GetDomainsQueryRequest,
  GetDomainsQueryResponse,
  IExtendedAreas,
} from './domain.api.types'

export const domainApi = createApi({
  reducerPath: 'domainApi',
  tagTypes: ['Domain', 'IDomain'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getDomain: builder.query<IDomain, string | undefined>({
      query: (id) => {
        return {
          url: `domain/${id}`,
          method: 'GET',
        }
      },
      providesTags: ['Domain'],
    }),
    getDomains: builder.query<GetDomainsQueryResponse, GetDomainsQueryRequest>({
      query: (query) => {
        return {
          url: `domain`,
          method: 'GET',
          params: toCleanObject(query),
        }
      },
      providesTags: ['Domain'],
    }),
    addDomain: builder.mutation<IDomain, Omit<IDomain, '_id'>>({
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
    deleteDomain: builder.mutation<IDomain, IDomain['_id']>({
      query(id) {
        return {
          url: `domain/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: ['Domain'],
    }),
    editDomain: builder.mutation<IDomain, Partial<IDomain>>({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `domain/${_id}`,
          method: 'PATCH',
          body: body,
        }
      },
      invalidatesTags: ['Domain'],
    }),
    getAreas: builder.query<IExtendedAreas, { domainId?: string }>({
      query: ({ domainId }) => ({
        url: `domain/areas/${domainId}`,
        method: 'GET',
      }),
      providesTags: ['Domain'],
    }),
  }),
})

export const {
  useGetAreasQuery,
  useGetDomainQuery,
  useGetDomainsQuery,
  useAddDomainMutation,
  useDeleteDomainMutation,
  useEditDomainMutation,
} = domainApi
