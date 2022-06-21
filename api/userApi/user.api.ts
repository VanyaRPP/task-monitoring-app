import { IUser } from './../../models/User';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface Quer {
  success: boolean
  data: IUser
}

export const userApi = createApi({
  reducerPath: 'userApi',
  tagTypes: ['User', 'IUser'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3000/api/' }),
  endpoints: (builder) => ({
    getUserByEmail: builder.query<Quer, string>({
      query: (email) => `user/${email}`,
    }),
    updateUser: builder.mutation<IUser, Partial<IUser>>({
      query(data) {
        console.log('data', data);
        const { email, ...body } = data
        return {
          url: `user/${email}?role=${body.role}`,
          method: 'PATCH',
          body,
        }
      },
      invalidatesTags: (result, error, { email }) => [{ type: 'User', email }],
    }),

  }),
})

export const { useGetUserByEmailQuery, useUpdateUserMutation } = userApi