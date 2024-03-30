import {
  IAddPaymentResponse,
  IDeletePaymentResponse,
  IExtendedPayment,
  IGetPaymentResponse,
  IGetPaymentNumberResponse,
  IPayment,
  IGeneratePaymentPDF,
  IGeneratePaymentPDFResponce,
} from './payment.api.types'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Operations } from '@utils/constants'

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
        type?: Operations
        email?: string
        year?: number
        quarter?: number
        month?: number
        day?: number
        domainIds?: string[]
        companyIds?: string[]
        streetIds?: string[]
      }
    >({
      query: ({
        limit,
        skip,
        email,
        type,
        year,
        quarter,
        month,
        day,
        domainIds,
        companyIds,
        streetIds,
      }) => {
        return {
          url: `spacehub/payment`,
          params: {
            limit,
            type,
            skip,
            email,
            year,
            quarter,
            month,
            day,
            domainIds,
            companyIds,
            streetIds,
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
    deleteMultiplePayments: builder.mutation<
      IDeletePaymentResponse,
      IExtendedPayment['_id'][]
    >({
      query(ids) {
        return {
          url: 'spacehub/payment/multiple',
          method: 'DELETE',
          body: { ids },
        };
      },
      invalidatesTags: (response) => (response ? ['Payment'] : []),
    }),
    getPaymentNumber: builder.query<number, object>({
      query: () => `spacehub/payment/number`,
      transformResponse: (response: IGetPaymentNumberResponse) => response.data,
    }),
    editPayment: builder.mutation<IExtendedPayment, Partial<IExtendedPayment>>({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `spacehub/payment/${_id}`,
          method: 'PATCH',
          body: body,
        }
      },
      invalidatesTags: (response) => (response ? ['Payment'] : []),
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
  useGetAllPaymentsQuery,
  useDeletePaymentMutation,
  useDeleteMultiplePaymentsMutation,
  useGetPaymentNumberQuery,
  useEditPaymentMutation,
  useGeneratePdfMutation,
} = paymentApi
