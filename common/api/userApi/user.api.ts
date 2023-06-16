import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { BaseQuery, IUser, AllUsersQuery, ISignUpData } from './user.api.types'

export const userApi = createApi({
  reducerPath: 'userApi',
  tagTypes: ['User', 'IUser'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    signUp: builder.mutation<ISignUpData, Partial<ISignUpData>>({
      query(data) {
        const { ...body } = data
        return {
          url: 'auth/sign-up',
          method: 'POST',
          body,
        }
      },
      invalidatesTags: ['User'],
    }),
    getUserByEmail: builder.query<BaseQuery, string | string[]>({
      query: (email) => `user/email/${email}`,
      providesTags: (result) => ['User'],
    }),
    getUserById: builder.query<BaseQuery, string>({
      query: (id) => `user/${id}`,
      providesTags: (result) => ['User'],
    }),
    updateUserRole: builder.mutation<IUser, Partial<IUser>>({
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
    updateUser: builder.mutation<IUser, Partial<IUser>>({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `user/${_id}`,
          method: 'PATCH',
          body,
        }
      },
      invalidatesTags: ['User'],
    }),
    getAllUsers: builder.query<IUser[], void>({
      query: () => '/user',
      providesTags: (result) => ['User'],
      transformResponse: (response: AllUsersQuery) => response.data,
    }),
    getCurrentUser: builder.query<IUser, void>({
      query: () => '/user/current',
      providesTags: (result) => ['User'],
      transformResponse: (response: BaseQuery) => response.data,
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
  useSignUpMutation,
  useGetUserByEmailQuery,
  useGetUserByIdQuery,
  useGetCurrentUserQuery,
  useUpdateUserRoleMutation,
  useUpdateUserMutation,
  useGetAllUsersQuery,
  useAddFeedbackMutation,
} = userApi
