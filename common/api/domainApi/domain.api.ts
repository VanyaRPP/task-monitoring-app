import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  IDomainModel,
  IExtendedDomain,
  IDeleteDomainResponse,
  IAddDomainResponse,
  IGetDomainResponse,
  IExtendedAreas,
  IGetAreasResponse,
  IGetDomainByPkResponse,
} from './domain.api.types'

export const domainApi = createApi({
  reducerPath: 'domainApi',
  tagTypes: ['Domain', 'IDomain'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getDomains: builder.query<
      IExtendedDomain[],
      { limit?: number; streetId?: string; domainId?: string }
    >({
      query: ({ limit, streetId, domainId }) => {
        return {
          url: `domain`,
          method: 'GET',
          params: { limit, streetId, domainId },
        }
      },
      providesTags: (response) =>
        response
          ? response.map((item) => ({ type: 'Domain', id: item._id }))
          : [],
      transformResponse: (response: IGetDomainResponse) => response.data,
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
    getDomainByPk: builder.query<IExtendedDomain, { domainId?: string }>({
      query: ({ domainId }) => ({
        url: `domain/${domainId}`,
        method: 'GET',
      }),
      providesTags: (result, error, { domainId }) => [
        { type: 'Domain', id: domainId },
      ],
      transformResponse: (response: IGetDomainByPkResponse) => response.data,
    }),
  }),
})

export const {
  useGetAreasQuery,
  useGetDomainsQuery,
  useAddDomainMutation,
  useDeleteDomainMutation,
  useEditDomainMutation,
  useGetDomainByPkQuery,
} = domainApi
