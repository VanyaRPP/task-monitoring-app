import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ICategory } from '../../models/Category'

interface AllCategoriesQuer {
  success: boolean
  data: ICategory[]
}

export const categoryApi = createApi({
  reducerPath: 'categoryApi',
  tagTypes: ['Category'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getAllCategories: builder.query<AllCategoriesQuer, string>({
      query: () => '/categories',
      providesTags: (result) => ['Category'],
    }),
  }),
})

export const { useGetAllCategoriesQuery } = categoryApi
