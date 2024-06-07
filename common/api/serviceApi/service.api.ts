import { toCleanObject } from '@utils/toCleanObject'
import {
  GetServicesQueryRequest,
  GetServicesQueryResponse,
  IGetServiceResponse,
} from './service.api.types'

import { IService } from '@common/modules/models/Service'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const serviceApi = createApi({
  reducerPath: 'serviceApi',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['Service'],
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getServices: builder.query<
      GetServicesQueryResponse,
      GetServicesQueryRequest
    >({
      query: (query) => {
        return {
          url: `service`,
          ...(query && { params: toCleanObject(query) }),
        }
      },
      providesTags: ['Service'],
    }),
    getService: builder.query<IService, string>({
      query: (id) => `service/${id}`,
      providesTags: ['Service'],
    }),
    getServicesAddress: builder.query({
      query: () => {
        return {
          url: `service/address`,
        }
      },
      transformResponse: (response: IGetServiceResponse) => response.data,
    }),
    addService: builder.mutation<IService, Partial<IService>>({
      query(body) {
        return {
          url: `service`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: (response) => (response ? ['Service'] : []),
    }),
    deleteService: builder.mutation<IService, IService['_id']>({
      query(id) {
        return {
          url: `service/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: ['Service'],
    }),
    editService: builder.mutation<IService, Partial<IService>>({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `service/${_id}`,
          method: 'PATCH',
          body: body,
        }
      },
      invalidatesTags: ['Service'],
    }),
  }),
})

export const {
  useAddServiceMutation,
  useGetServicesQuery,
  useGetServiceQuery,
  useGetServicesAddressQuery,
  useDeleteServiceMutation,
  useEditServiceMutation,
} = serviceApi
