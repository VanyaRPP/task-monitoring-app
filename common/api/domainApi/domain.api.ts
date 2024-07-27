import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { toCleanObject } from '@utils/helpers'
import type {
  GetDomainsFiltersRequest,
  GetDomainsFiltersResponse,
} from './domain.api.types'
import {
  GetDomainsRequest,
  GetDomainsResponse,
  IAddDomainResponse,
  IDeleteDomainResponse,
  IDomainModel,
  IExtendedAreas,
  IExtendedDomain,
  IGetAreasResponse,
} from './domain.api.types'

export const domainApi = createApi({
  reducerPath: 'domainApi',
  tagTypes: ['Domain', 'IDomain'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getDomains: builder.query<GetDomainsResponse, GetDomainsRequest>({
      query: (query) => ({
        url: 'domain',
        method: 'GET',
        params: toCleanObject(query),
      }),
      providesTags: ['Domain'],
    }),
    getDomainsFilters: builder.query<
      GetDomainsFiltersResponse,
      GetDomainsFiltersRequest
    >({
      query: () => ({
        url: `domain/filters`,
        method: 'GET',
      }),
      providesTags: ['Domain'],
    }),
    addDomain: builder.mutation<IAddDomainResponse, IDomainModel>({
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
    editDomain: builder.mutation<IExtendedDomain, Partial<IExtendedDomain>>({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `domain/${_id}`,
          method: 'PATCH',
          body: body,
        }
      },
      invalidatesTags: (response) => (response ? ['Domain'] : []),
    }),
    getAreas: builder.query<IExtendedAreas, { domainId?: string }>({
      query: ({ domainId }) => ({
        url: `domain/areas/${domainId}`,
        method: 'GET',
      }),
      providesTags: (result, error, { domainId }) => [
        { type: 'IDomain', id: domainId || '' },
      ],
      transformResponse: (response: IGetAreasResponse) => response.data,
    }),
  }),
})

export const {
  useGetAreasQuery,
  useGetDomainsQuery,
  useAddDomainMutation,
  useDeleteDomainMutation,
  useEditDomainMutation,
  useGetDomainsFiltersQuery,
} = domainApi
