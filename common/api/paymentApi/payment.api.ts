import {
  IAddPaymentResponse,
  IDeletePaymentResponse,
  IExtendedPayment,
  IGetPaymentResponse,
  IGetPaymentsCountResponse,
  IPayment,
} from './payment.api.types'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['Payment'],
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getAllPayments: builder.query<
      IExtendedPayment[],
      { limit: number; email?: string }
    >({
      query: ({ limit, email }) => {
        return {
          url: `spacehub/payment`,
          params: { limit, email },
        }
      },
      providesTags: (response) =>
        response
          ? response.map((item) => ({ type: 'Payment', id: item._id }))
          : [],
      transformResponse: (response: IGetPaymentResponse) => response.data,
    }),
    addPayment: builder.mutation<IAddPaymentResponse, IPayment>({
      query(body) {
        return {
          url: `spacehub/payment`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: (response) => (response ? ['Payment'] : []),
    }),
    deletePayment: builder.mutation<
      IDeletePaymentResponse,
      IExtendedPayment['_id']
    >({
      query(id) {
        return {
          url: `spacehub/payment/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: (response) => (response ? ['Payment'] : []),
    }),
    getPaymentsCount: builder.query<number, void>({
      query: () => `spacehub/payment/count`,
      transformResponse: (response: IGetPaymentsCountResponse) => response.data,
    }),
  }),
})

export const {
  useAddPaymentMutation,
  useGetAllPaymentsQuery,
  useDeletePaymentMutation,
  useGetPaymentsCountQuery,
} = paymentApi
