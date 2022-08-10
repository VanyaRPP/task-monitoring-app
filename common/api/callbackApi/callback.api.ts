import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ObjectId } from 'mongoose'
import { AllCallbackQuery, BaseQuery, ICallback } from './callback.type'

export const callbackApi = createApi({
  reducerPath: 'callbackApi',
  tagTypes: ['Callback', 'ICallback'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getCallbackById: builder.query<BaseQuery, string>({
      query: (id) => `/callback/${id}`,
      providesTags: (result) => ['Callback'],
    }),
    getAllCallbacks: builder.query<AllCallbackQuery, string>({
      query: () => '/callback',
      providesTags: (result) => ['Callback'],
    }),
    addCallback: builder.mutation<ICallback, Partial<ICallback>>({
      query(data) {
        const { ...body } = data
        return {
          url: `callback`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: ['Callback'],
    }),
    deleteCallback: builder.mutation<
      { success: boolean; id: ObjectId },
      string
    >({
      query(id) {
        return {
          url: `callback/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: ['Callback'],
    }),
  }),
})

export const {
  useAddCallbackMutation,
  useDeleteCallbackMutation,
  useGetAllCallbacksQuery,
  useGetCallbackByIdQuery
} = callbackApi
