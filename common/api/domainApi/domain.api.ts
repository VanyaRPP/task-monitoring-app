import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  IDomainModel,
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
      { limit?: number; streetId?: string }
    >({
      query: ({ limit, streetId }) => {
        return {
          url: `domain`,
          params: { limit, streetId },
        }
      },
      providesTags: (response) =>
        response
          ? response.map((item) => ({ type: 'Domain', id: item._id }))
          : [],
      transformResponse: (response: IGetDomainResponse) => response.data,
    }),
    // TODO: fix and add typisation
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    getMyDomains: builder.query<IExtendedDomain[]>({
      query: () => {
        return {
          url: `domain/my`,
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
  }),
})

export const {
  useGetMyDomainsQuery,
  useGetDomainsQuery,
  useAddDomainMutation,
  useDeleteDomainMutation,
} = domainApi
