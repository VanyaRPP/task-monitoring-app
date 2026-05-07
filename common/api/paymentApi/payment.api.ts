import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Operations } from '@utils/constants'
import { invalidateDebtorsOnSuccess } from '@common/api/debtorsApi/debtors.api'
import {
  IAddPaymentResponse,
  IDeletePaymentResponse,
  IExtendedPayment,
  IGeneratePaymentPDF,
  IGeneratePaymentPDFResponce,
  IGetPaymentNumberResponse,
  IGetPaymentResponse,
  IPayment,
  IGetCostPaymentResponse,
  IGeneratePaymentExcel,
  IGeneratePaymentExcelResponce,
  IAddCostPaymentResponse,
  ICostPayment,
  IGetPaymentChangeLogsResponse,
  ICreatePaymentChangeLogResponse,
} from './payment.api.types'

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['Payment', 'Profit'],
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
        month?: number | number[]
        day?: number
        domainIds?: string[]
        companyIds?: string[]
        streetIds?: string[]
        serviceIds?: string[]
        dateField?: 'invoiceCreationDate' | 'date'
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
        serviceIds,
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
            serviceIds,
          },
        }
      },

      providesTags: (response) =>
        response
          ? response.data.map((item) => ({ type: 'Payment', id: item._id }))
          : [],
    }),
    getPayment: builder.query<IGetPaymentResponse, string>({
      query: (id) => `spacehub/payment/${id}`,
    }),
    getCostPayment: builder.query<IGetCostPaymentResponse, void>({
      query: () => ({
        url: `profit`,
      }),
      providesTags: (result) => (result ? ['Profit'] : []),
    }),
    addPayment: builder.mutation<IAddPaymentResponse, IPayment>({
      query(body) {
        return {
          url: `spacehub/payment`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: (response) => (response ? ['Payment', 'Profit'] : []),
      onQueryStarted: invalidateDebtorsOnSuccess,
    }),
    addCostPayment: builder.mutation<IAddCostPaymentResponse, ICostPayment>({
      query(body) {
        return {
          url: `profit`,
          method: 'POST',
          body,
        }
      },
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
      onQueryStarted: invalidateDebtorsOnSuccess,
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
        }
      },
      invalidatesTags: (response) => (response ? ['Payment'] : []),
      onQueryStarted: invalidateDebtorsOnSuccess,
    }),
    getPaymentNumber: builder.query<number, object>({
      query: () => `spacehub/payment/number`,
      transformResponse: (response: IGetPaymentNumberResponse) => response.data,
      providesTags: ['Payment'],
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
    markPaymentsPaid: builder.mutation<
      {
        createdIds: string[]
        skippedIds: string[]
        totalRequested: number
      },
      string[]
    >({
      query: (ids) => ({
        url: `spacehub/payment/mark-paid`,
        method: 'POST',
        body: { ids },
      }),
      transformResponse: (response: {
        success: boolean
        data: {
          createdIds: string[]
          skippedIds: string[]
          totalRequested: number
        }
      }) => response.data,
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
    generateExcel: builder.mutation<
      IGeneratePaymentExcelResponce,
      IGeneratePaymentExcel
    >({
      query: (body) => ({
        url: 'spacehub/payment/generateExcel',
        method: 'POST',
        body,
      }),
    }),
    getPaymentChangeLogs: builder.query<IGetPaymentChangeLogsResponse, string>({
      query: (paymentId) => `spacehub/payment/${paymentId}/change-log`,
      providesTags: (res, err, paymentId) =>
        res ? [{ type: 'Payment', id: paymentId }] : [],
    }),

    createPaymentChangeLog: builder.mutation<
      ICreatePaymentChangeLogResponse,
      { paymentId: string; invoiceData: any; reason?: string }
    >({
      query: ({ paymentId, ...body }) => ({
        url: `spacehub/payment/${paymentId}/change-log`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (res, err, args) =>
        res ? [{ type: 'Payment', id: args.paymentId }] : [],
    }),
  }),
})
export const {
  useGetPaymentChangeLogsQuery,
  useCreatePaymentChangeLogMutation,
  useAddPaymentMutation,
  useGetAllPaymentsQuery,
  useGetPaymentQuery,
  useDeletePaymentMutation,
  useDeleteMultiplePaymentsMutation,
  useGetPaymentNumberQuery,
  useEditPaymentMutation,
  useMarkPaymentsPaidMutation,
  useGeneratePdfMutation,
  useGetCostPaymentQuery,
  useAddCostPaymentMutation,
  useGenerateExcelMutation,
} = paymentApi
