import {
  IAddPaymentResponse,
  IExtendedPayment,
  IGetPaymentResponse,
  IPayment,
} from './payment.api.types'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const paymentApi = createApi({
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['Payment'],
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getAllPayments: builder.query<IExtendedPayment[], string>({
      query: () => 'spacehub/payment',
      providesTags: ['Payment'],
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
      invalidatesTags: ['Payment'],
    }),
  }),
})

export const { useAddPaymentMutation, useGetAllPaymentsQuery } = paymentApi
