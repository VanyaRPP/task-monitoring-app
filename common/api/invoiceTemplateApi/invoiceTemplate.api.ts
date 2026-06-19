import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  ICreateInvoiceTemplateRequest,
  ICreateInvoiceTemplateResponse,
  IDeleteInvoiceTemplateResponse,
  IGetInvoiceTemplatesRequest,
  IGetInvoiceTemplatesResponse,
  IUpdateInvoiceTemplateRequest,
  IUpdateInvoiceTemplateResponse,
} from './invoiceTemplate.api.types'

export const invoiceTemplateApi = createApi({
  reducerPath: 'invoiceTemplateApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['InvoiceTemplate'],
  endpoints: (builder) => ({
    getInvoiceTemplates: builder.query<
      IGetInvoiceTemplatesResponse,
      IGetInvoiceTemplatesRequest
    >({
      query: ({ domainId }) => ({
        url: 'invoice-templates',
        method: 'GET',
        params: { domainId },
      }),
      providesTags: ['InvoiceTemplate'],
    }),

    createInvoiceTemplate: builder.mutation<
      ICreateInvoiceTemplateResponse,
      ICreateInvoiceTemplateRequest
    >({
      query: (body) => ({
        url: 'invoice-templates',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['InvoiceTemplate'],
    }),

    updateInvoiceTemplate: builder.mutation<
      IUpdateInvoiceTemplateResponse,
      IUpdateInvoiceTemplateRequest
    >({
      query: ({ _id, ...body }) => ({
        url: `invoice-templates/${_id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['InvoiceTemplate'],
    }),

    deleteInvoiceTemplate: builder.mutation<
      IDeleteInvoiceTemplateResponse,
      { _id: string }
    >({
      query: ({ _id }) => ({
        url: `invoice-templates/${_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['InvoiceTemplate'],
    }),
  }),
})

export const {
  useGetInvoiceTemplatesQuery,
  useCreateInvoiceTemplateMutation,
  useUpdateInvoiceTemplateMutation,
  useDeleteInvoiceTemplateMutation,
} = invoiceTemplateApi
