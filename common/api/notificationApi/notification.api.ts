import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { BaseQuery, INotification } from './notification.api.types'

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  tagTypes: ['Notification', 'INotification'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getNotificationsByUserId: builder.query<BaseQuery, string>({
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
    updateNotificationStatusById: builder.mutation<
      INotification,
      Partial<INotification>
    >({
      query(data) {
        const { _id } = data
        return {
          url: `notify/${_id}`,
          method: 'PATCH',
          body: {
            isSeen: true,
            type: true,
          },
        }
      },
      invalidatesTags: ['Notification'],
    }),
    updateNotificationsStatusByUserId: builder.mutation<
      INotification,
      Partial<INotification>
    >({
      query(data) {
        const { _id } = data
        return {
          url: `notify/${_id}`,
          method: 'PATCH',
          body: {
            isSeen: true,
            type: false,
          },
        }
      },
      invalidatesTags: ['Notification'],
    }),
    deleteNotificationById: builder.mutation<
      INotification,
      Partial<INotification>
    >({
      query(data) {
        const { _id } = data
        return {
          url: `notify/${_id}`,
          method: 'DELETE',
          body: {
            type: true,
          },
        }
      },
      invalidatesTags: ['Notification'],
    }),
    deleteNotificationsByUserId: builder.mutation<
      INotification,
      Partial<INotification>
    >({
      query(data) {
        const { _id } = data
        return {
          url: `notify/${_id}`,
          method: 'DELETE',
          body: {
            type: false,
          },
        }
      },
      invalidatesTags: ['Notification'],
    }),
  }),
})

export const {
  useGetNotificationsByUserIdQuery,
  useAddNotificationMutation,
  useUpdateNotificationStatusByIdMutation,
  useUpdateNotificationsStatusByUserIdMutation,
  useDeleteNotificationByIdMutation,
  useDeleteNotificationsByUserIdMutation,
} = notificationApi
