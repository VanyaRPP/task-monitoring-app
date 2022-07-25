import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { BaseQuery, IUser, AllUsersQuery } from './user.api.types'

export const userApi = createApi({
  reducerPath: 'userApi',
  tagTypes: ['User', 'IUser'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getUserByEmail: builder.query<BaseQuery, string>({
      query: (email) => `user/email/${email}`,
      providesTags: (result) => ['User'],
    }),
    getUserById: builder.query<BaseQuery, string>({
      query: (id) => `user/${id}`,
      providesTags: (result) => ['User'],
    }),
    updateUser: builder.mutation<IUser, Partial<IUser>>({
      query(data) {
        const { email, ...body } = data
        return {
          url: `user/email/${email}?role=${body.role}`,
          method: 'PATCH',
          body,
        }
      },
      invalidatesTags: ['User'],
    }),
    getAllUsers: builder.query<AllUsersQuery, string>({
      query: () => '/user',
      providesTags: (result) => ['User'],
    }),
    addFeedback: builder.mutation<IUser, Partial<IUser>>({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `user/${_id}/feedback`,
          method: 'PATCH',
          body,
        }
      },
      invalidatesTags: ['User'],
    }),
  }),
})

export const {
  useGetUserByEmailQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useGetAllUsersQuery,
  useAddFeedbackMutation,
} = userApi
