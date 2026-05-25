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
      providesTags: (response: IGetServiceResponse) => [
        'Service',
        ...(response?.data
          ? response.data.map((item) => ({
              type: 'Service' as const,
              id: item._id,
            }))
          : []),
      ],
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
      invalidatesTags: (result, error, id) => [{ type: 'Service', id }],
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
      invalidatesTags: (result) =>
        result ? [{ type: 'Service', id: result._id }] : [],
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
