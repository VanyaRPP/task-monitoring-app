import { paymentApi } from '../paymentApi/payment.api'
import {
  ICreatePaymentChangeLogResponse,
  IDeletePaymentChangeLogResponse,
  IGetPaymentChangeLogsResponse,
} from '../paymentApi/payment.api.types'

export const changelogApi = paymentApi.injectEndpoints({
  endpoints: (builder) => ({
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

    deletePaymentChangeLog: builder.mutation<
      IDeletePaymentChangeLogResponse,
      { paymentId: string; changeLogid: string }
    >({
      query: ({ paymentId, changeLogid }) => ({
        url: `spacehub/payment/${paymentId}/change-log?changeLogId=${changeLogid}`,
        method: 'DELETE',
      }),
      invalidatesTags: (res, err, args) =>
        res ? [{ type: 'Payment', id: args.paymentId }] : [],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetPaymentChangeLogsQuery,
  useCreatePaymentChangeLogMutation,
  useDeletePaymentChangeLogMutation,
} = changelogApi
