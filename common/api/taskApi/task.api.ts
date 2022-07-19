import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ObjectId } from 'mongoose'
import { ICreateTask, ITask } from '../../modules/models/Task'

interface IDeleteQuery {
  userId: number | string
  itemId: number | string
}

interface AllTasksQuer {
  success: boolean
  data: ITask[]
}

interface TaskQuer {
  success: boolean
  data: ITask
}

export const taskApi = createApi({
  reducerPath: 'taskApi',
  tagTypes: ['Task', 'User', 'IUser'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getAllTask: builder.query<AllTasksQuer, string>({
      query: () => '/task',
      providesTags: (result) => ['Task'],
    }),
    getTaskById: builder.query<TaskQuer, string>({
      query: (id) => `/task/${id}`,
      providesTags: (result) => ['Task'],
    }),
    addTask: builder.mutation<ICreateTask, Partial<ICreateTask>>({
      query(data) {
        const { ...body } = data
        return {
          url: `task`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: ['Task'],
    }),
    deleteTask: builder.mutation<{ success: boolean; id: ObjectId }, ObjectId>({
      query(id) {
        return {
          url: `task/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: ['Task'],
    }),
    addComment: builder.mutation<ITask, Partial<ITask>>({
      query(data) {
        console.log(data)
        const { _id, ...body } = data
        return {
          url: `task/comments/${_id}`,
          method: 'PATCH',
          body,
        }
      },
      invalidatesTags: ['Task'],
    }),
    deleteComment: builder.mutation<IDeleteQuery, Partial<IDeleteQuery>>({
      query(data) {
        const { userId, itemId } = data
        return {
          url: `task/comments/${userId}?comment=${itemId}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: ['Task'],
    }),
  }),
})

export const {
  useGetAllTaskQuery,
  useAddTaskMutation,
  useGetTaskByIdQuery,
  useDeleteTaskMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
} = taskApi
