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
      IGetPaymentResponse,
      { limit: number; email?: string, year?: number, quarter?: number, month?: number, day?: number }
    >({
      query: ({ limit, email, year, quarter, month, day }) => {
        return {
          url: `spacehub/payment`,
          params: { limit, email, year, quarter, month, day },
        }
      },
      providesTags: (response) =>
        response
          ? response.data.map((item) => ({ type: 'Payment', id: item._id }))
          : [],
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
    getPaymentsCount: builder.query<number, object>({
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
