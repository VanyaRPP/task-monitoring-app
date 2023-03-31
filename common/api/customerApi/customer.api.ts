import {
  IAddCustomerResponse,
  IDeleteCustomerResponse,
  IExtendedCustomer,
  IGetCustomerResponse,
  ICustomer,
} from './customer.api.types'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const customerApi = createApi({
  reducerPath: 'customerApi',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['Customer'],
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getAllCustomer: builder.query<
      IExtendedCustomer[],
      { limit: number; email?: string }
    >({
      query: ({ limit, email }) => {
        return {
          url: `user`,
          params: { limit, email },
        }
      },
      providesTags: (response) =>
        response
          ? response.map((item) => ({ type: 'Customer', id: item._id }))
          : [],
      transformResponse: (response: IGetCustomerResponse) => response.data,
    }),
    addCustomer: builder.mutation<IAddCustomerResponse, ICustomer>({
      query(body) {
        return {
          url: `user`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: (response) => (response ? ['Customer'] : []),
    }),
    deleteCustomer: builder.mutation<
      IDeleteCustomerResponse,
      IExtendedCustomer['_id']
    >({
      query(id) {
        return {
          url: `user/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: (response) => (response ? ['Customer'] : []),
    }),
  }),
})

export const {
  useAddCustomerMutation,
  useGetAllCustomerQuery,
  useDeleteCustomerMutation,
} = customerApi
