import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ICategory } from '../../models/Category'
import { ObjectId } from 'mongoose'

interface AllCategoriesQuer {
  success: boolean
  data: ICategory[]
}

export const categoryApi = createApi({
  reducerPath: 'categoryApi',
  tagTypes: ['Category', 'ICategory'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getAllCategories: builder.query<AllCategoriesQuer, string>({
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
      ObjectId
    >({
      query(id) {
        return {
          url: `categories/${id}`,
          method: 'DELETE',
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
} = categoryApi
