import { IUser } from '../../modules/models/User'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface Quer {
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
    getUserByEmail: builder.query<Quer, string>({
      query: (email) => `user/${email}`,
      providesTags: (result) => ['User'],
    }),
    getUserById: builder.query<Quer, string>({
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
          url: `user/id/${_id}`,
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
