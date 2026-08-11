import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { GroupedProfitResponse, Profit } from './profits.type'

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const profitApi = createApi({
  reducerPath: 'profitApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/profits' }),
  tagTypes: ['Profit'],
  endpoints: (builder) => ({
    getProfits: builder.query<
      PaginatedResponse<Profit>,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) => `?page=${page}&limit=${limit}`,
      providesTags: ['Profit'],
    }),

    getProfitById: builder.query<Profit, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Profit', id }],
    }),

    getByDomain: builder.query<
      GroupedProfitResponse,
      { domainId: string; page?: number; limit?: number }
    >({
      query: ({ domainId, page = 1, limit = 10 }) =>
        `/domain/${domainId}?page=${page}&limit=${limit}`,
      providesTags: ['Profit'],
    }),

    getBalance: builder.query<number, string>({
      query: (domainId) => `/balance/${domainId}`,
    }),

    createProfit: builder.mutation<Profit, Partial<Profit>>({
      query: (body) => ({
        url: '',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Profit'],
    }),

    bulkCreateProfit: builder.mutation<Profit[], Partial<Profit>[]>({
      query: (body) => ({
        url: '/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Profit'],
    }),

    updateProfit: builder.mutation<
      Profit,
      { id: string; body: Partial<Profit> }
    >({
      query: ({ id, body }) => ({
        url: `/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Profit'],
    }),

    deleteProfit: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Profit'],
    }),
  }),
})

export const {
  useGetProfitsQuery,
  useGetProfitByIdQuery,
  useGetByDomainQuery,
  useGetBalanceQuery,
  useCreateProfitMutation,
  useBulkCreateProfitMutation,
  useUpdateProfitMutation,
  useDeleteProfitMutation,
} = profitApi
