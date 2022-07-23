import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ObjectId } from 'mongoose'
import { AllCategoriesQuery, ICategory } from './category.api.types'

export const categoryApi = createApi({
  reducerPath: 'categoryApi',
  tagTypes: ['Category', 'ICategory'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getAllCategories: builder.query<AllCategoriesQuery, string>({
      query: () => '/categories',
      providesTags: (result) => ['Category'],
    }),
    addCategory: builder.mutation<ICategory, Partial<ICategory>>({
      query(data) {
        const { ...body } = data
        return {
          url: `categories`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation<
      { success: boolean; id: ObjectId },
      string
    >({
      query(id) {
        return {
          url: `categories/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: ['Category'],
    }),
    editCategory: builder.mutation<ICategory, Partial<ICategory>>({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `categories/${_id}`,
          method: 'PATCH',
        }
      },
      invalidatesTags: ['Category'],
    }),
  }),
})

export const {
  useGetAllCategoriesQuery,
  useAddCategoryMutation,
  useDeleteCategoryMutation,
  useEditCategoryMutation,
} = categoryApi
