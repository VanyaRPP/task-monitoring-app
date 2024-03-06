import {
  IAddServiceResponse,
  IDeleteServiceResponse,
  IExtendedService,
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
        domainId?: string
        streetId?: string
        serviceId?: string
        year?: number
        month?: number
      }
    >({
      query: ({
        limit,
        userId,
        domainId,
        streetId,
        serviceId,
        year,
        month,
      }) => {
        return {
          url: `service`,
          params: { limit, userId, domainId, streetId, serviceId, year, month },
        }
      },
      providesTags: (response: IGetServiceResponse) =>
        response?.data
          ? response.data.map((item) => ({ type: 'Service', id: item._id }))
          : [],
      // transformResponse: (response: any) => response.data,
    }),
    getServicesAddress: builder.query({
      query: () => {
        return {
          url: `service/address`,
        }
      },
      transformResponse: (response: IGetServiceResponse) => response.data,
    }),
    addService: builder.mutation<IAddServiceResponse, IService>({
      query(body) {
        return {
          url: `service`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: (response) => (response ? ['Service'] : []),
    }),
    deleteService: builder.mutation<
      IDeleteServiceResponse,
      IExtendedService['_id']
    >({
      query(id) {
        return {
          url: `service/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: (response) => (response ? ['Service'] : []),
    }),
    editService: builder.mutation<IExtendedService, Partial<IExtendedService>>({
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
