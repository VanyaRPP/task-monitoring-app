import { months } from 'moment'
import {
  IAddPaymentResponse,
  IDeletePaymentResponse,
  IExtendedPayment,
  IGetPaymentResponse,
  IGetPaymentsCountResponse,
  IPayment,
  IPaymentsCount,
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
      {
        limit: number
        skip?: number
        email?: string
        year?: number
        quarter?: number
        month?: number
        day?: number
        domainIds?: string[]
        companyIds?: string[]
      }
    >({
      query: ({
        limit,
        skip,
        email,
        year,
        quarter,
        month,
        day,
        domainIds,
        companyIds,
      }) => {
        return {
          url: `spacehub/payment`,
          params: {
            limit,
            skip,
            email,
            year,
            quarter,
            month,
            day,
            domainIds,
            companyIds,
          },
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
    getPaymentsCount: builder.query<IPaymentsCount, object>({
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
