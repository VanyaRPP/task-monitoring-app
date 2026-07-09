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
      // Insert the created template into the cached list synchronously so a
      // freshly-saved copy is resolvable immediately — the invalidation refetch
      // is async and would otherwise let the picker/editor briefly fall back to
      // the classic base layout.
      async onQueryStarted({ domainId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            invoiceTemplateApi.util.updateQueryData(
              'getInvoiceTemplates',
              { domainId },
              (draft) => {
                if (!draft.data.some((t) => t._id === data.data._id)) {
                  draft.data.push(data.data)
                }
              }
            )
          )
        } catch {
          // Create failed — nothing to insert.
        }
      },
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
