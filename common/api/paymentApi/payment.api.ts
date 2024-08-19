import { IPayment } from '@common/modules/models/Payment'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { toCleanObject } from '@utils/toCleanObject'
import {
  GetPaymentsQueryRequest,
  GetPaymentsQueryResponse,
  IDeletePaymentResponse,
  IGeneratePaymentPDF,
  IGeneratePaymentPDFResponce,
  IGetPaymentNumberResponse,
} from './payment.api.types'

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['Payment'],
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getPayments: builder.query<
      GetPaymentsQueryResponse,
      GetPaymentsQueryRequest
    >({
      query: (query) => {
        return {
          url: `spacehub/payment`,
          ...(query && { params: toCleanObject(query) }),
        }
      },
      providesTags: ['Payment'],
    }),
    getPayment: builder.query<IPayment, string>({
      query: (id) => `spacehub/payment/${id}`,
      providesTags: ['Payment'],
    }),
    addPayment: builder.mutation<IPayment, Partial<IPayment>>({
      query(body) {
        return {
          url: `spacehub/payment`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: ['Payment'],
    }),
    deletePayment: builder.mutation<IDeletePaymentResponse, IPayment['_id']>({
      query(id) {
        return {
          url: `spacehub/payment/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: ['Payment'],
    }),
    deleteMultiplePayments: builder.mutation<
      IDeletePaymentResponse,
      IPayment['_id'][]
    >({
      query(ids) {
        return {
          url: 'spacehub/payment/multiple',
          method: 'DELETE',
          body: { ids },
        }
      },
      invalidatesTags: ['Payment'],
    }),
    getPaymentNumber: builder.query<number, object>({
      query: () => `spacehub/payment/number`,
      transformResponse: (response: IGetPaymentNumberResponse) => response.data,
    }),
    editPayment: builder.mutation<IPayment, Partial<IPayment>>({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `spacehub/payment/${_id}`,
          method: 'PATCH',
          body: body,
        }
      },
      invalidatesTags: ['Payment'],
    }),
    generatePdf: builder.mutation<
      IGeneratePaymentPDFResponce,
      IGeneratePaymentPDF
    >({
      query: (body) => ({
        url: 'spacehub/payment/generatePdf',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const {
  useAddPaymentMutation,
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useDeletePaymentMutation,
  useDeleteMultiplePaymentsMutation,
  useGetPaymentNumberQuery,
  useEditPaymentMutation,
  useGeneratePdfMutation,
} = paymentApi
