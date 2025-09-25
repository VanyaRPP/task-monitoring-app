import {
  IAddServiceResponse,
  IDeleteServiceResponse,
  IGetServiceResponse,
  IService,
} from './service.api.types'

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const serviceApi = createApi({
  reducerPath: 'serviceApi',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['Service'],
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getAllServices: builder.query<
      IGetServiceResponse,
      {
        limit?: number
        userId?: string
        domainIds?: string[]
        streetIds?: string[]
        serviceId?: string
        year?: number
        month?: number
      }
    >({
      serializeQueryArgs: ({ queryArgs }) => {
        const { domainIds = [], streetIds = [], ...rest } = (queryArgs ?? {}) as any
        return {
          ...rest,
          domainIds: [...domainIds].sort(),
          streetIds: [...streetIds].sort(),
        }
      },
      query: ({ limit, userId, serviceId, year, month, domainIds, streetIds }) => {
        const params: Record<string, any> = { limit, userId, serviceId, year, month }

        const d = domainIds?.filter(Boolean)
        const s = streetIds?.filter(Boolean)

        if (d?.length) params.domainIds = d 
        if (s?.length) params.streetIds = s

        return { url: `service`, params }
      },
      providesTags: (response: IGetServiceResponse) =>
        response?.data
          ? response.data.map((item) => ({ type: 'Service', id: item._id }))
          : [],
    }),
    getServicesAddress: builder.query({
      query: () => {
        return {
          url: `service/address`,
        }
      },
      transformResponse: (response: IGetServiceResponse) => response.data,
    }),
    addService: builder.mutation<
      IAddServiceResponse,
      Omit<IService, '_id' | 'domain' | 'street'> & {
        domain: string
        street: string
      }
    >({
      query(body) {
        return {
          url: `service`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: (response) => (response ? ['Service'] : []),
    }),
    deleteService: builder.mutation<IDeleteServiceResponse, IService['_id']>({
      query(id) {
        return {
          url: `service/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: (response) => (response ? ['Service'] : []),
    }),
    editService: builder.mutation<
      IService,
      Omit<IService, 'domain' | 'street'> & {
        domain: string
        street: string
      }
    >({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `service/${_id}`,
          method: 'PATCH',
          body: body,
        }
      },
      invalidatesTags: (response) => (response ? ['Service'] : []),
    }),
  }),
})

export const {
  useAddServiceMutation,
  useGetAllServicesQuery,
  useGetServicesAddressQuery,
  useDeleteServiceMutation,
  useEditServiceMutation,
} = serviceApi
