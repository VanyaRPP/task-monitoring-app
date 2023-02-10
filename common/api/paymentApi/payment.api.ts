import { IAddPayment, IPaymentResponse } from './payment.api.types'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const paymentApi = createApi({
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['Payment'],
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getAllPayments: builder.query<any, string>({
      query: () => '/spacehub/payment',
      providesTags: ['Payment'],
    }),
    addPayment: builder.mutation<IPaymentResponse, IAddPayment>({
      query(body) {
        return {
          url: `spacehub/payment`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: ['Payment'],
    }),
  }),
})

export const { useAddPaymentMutation, useGetAllPaymentsQuery } = paymentApi
