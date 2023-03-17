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
      IExtendedService[],
      { limit: number; userId?: string }
    >({
      query: ({ limit, userId }) => {
        return {
          url: `service`,
          params: { limit, userId },
        }
      },
      providesTags: (response) =>
        response
          ? response.map((item) => ({ type: 'Service', id: item._id }))
          : [],
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
  }),
})

export const {
  useAddServiceMutation,
  useGetAllServicesQuery,
  useDeleteServiceMutation,
} = serviceApi
