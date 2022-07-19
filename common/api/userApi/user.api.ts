import { IUser } from '../../modules/models/User'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface IDeleteQuery {
  userId: number | string
  itemId: number | string
}

interface BaseQuery {
  success: boolean
  data: IUser
}

interface AllUsersQuer {
  success: boolean
  data: IUser[]
}

export const userApi = createApi({
  reducerPath: 'userApi',
  tagTypes: ['User', 'IUser'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getUserByEmail: builder.query<BaseQuery, string>({
      query: (email) => `user/${email}`,
      providesTags: (result) => ['User'],
    }),
    getUserById: builder.query<BaseQuery, string>({
      query: (id) => `user/id/${id}`,
      providesTags: (result) => ['User'],
    }),
    updateUser: builder.mutation<IUser, Partial<IUser>>({
      query(data) {
        const { email, ...body } = data
        return {
          url: `user/${email}?role=${body.role}`,
          method: 'PATCH',
          body,
        }
      },
      invalidatesTags: ['User'],
    }),
    getAllUsers: builder.query<AllUsersQuer, string>({
      query: () => '/user',
      providesTags: (result) => ['User'],
    }),
    addFeedback: builder.mutation<IUser, Partial<IUser>>({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `user/feedbacks/${_id}`,
          method: 'PATCH',
          body,
        }
      },
      invalidatesTags: ['User'],
    }),
    addComment: builder.mutation<IUser, Partial<IUser>>({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `user/comments/${_id}`,
          method: 'PATCH',
          body,
        }
      },
      invalidatesTags: ['User'],
    }),
    deleteComment: builder.mutation<IDeleteQuery, Partial<IDeleteQuery>>({
      query(data) {
        const { userId, itemId } = data
        return {
          url: `user/comments/${userId}?comment=${itemId}`,
          method: 'DELETE',
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
  useAddCommentMutation,
  useDeleteCommentMutation,
} = userApi
