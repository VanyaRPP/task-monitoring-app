import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { BaseQuery, INotification } from './notification.api.types'

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  tagTypes: ['Notification', 'INotification'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getNotificationById: builder.query<BaseQuery, string>({
      query: (id) => `notify/${id}`,
      providesTags: (result) => ['Notification'],
    }),
    addNotification: builder.mutation<INotification, Partial<INotification>>({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `notify`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: ['Notification'],
    }),
  }),
})

export const { useGetNotificationByIdQuery, useAddNotificationMutation } =
  notificationApi
