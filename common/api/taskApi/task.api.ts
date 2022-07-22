import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ObjectId } from 'mongoose'
import { ICreateTask, ITask, ITaskExecutors } from 'common/modules/models/Task'
import {
  AllTasksQuery,
  TaskQuery,
  IDeleteQuery,
  IAcceptQuery,
} from './task.api.types'

export const taskApi = createApi({
  reducerPath: 'taskApi',
  tagTypes: ['Task', 'User', 'IUser'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getAllTask: builder.query<AllTasksQuery, string>({
      query: () => '/task',
      providesTags: (result) => ['Task'],
    }),
    getTaskById: builder.query<TaskQuery, string>({
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
    deleteTask: builder.mutation<{ success: boolean; id: ObjectId }, string>({
      query(id) {
        return {
          url: `task/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: ['Task'],
    }),
    editTask: builder.mutation<ITask, Partial<ITask>>({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `task/${_id}/edit-task`,
          method: 'PATCH',
          body,
        }
      },
      invalidatesTags: ['Task'],
    }),
    addTaskExecutor: builder.mutation<TaskQuery, ITaskExecutors>({
      query(data) {
        const { ...body } = data
        return {
          url: `task/${data.taskId}/apply`,
          method: 'PATCH',
          body,
        }
      },
      invalidatesTags: ['Task'],
    }),
    addComment: builder.mutation<ITask, Partial<ITask>>({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `task/${_id}/comment`,
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
          url: `task/comment/${userId}?comment=${itemId}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: ['Task'],
    }),
    acceptWorker: builder.mutation<ITask, Partial<IAcceptQuery>>({
      query(data) {
        const { taskId, workerId } = data
        return {
          url: `task/${taskId}/accept?executant=${workerId}`,
          method: 'PATCH',
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
  useAddTaskExecutorMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useAcceptWorkerMutation,
  useEditTaskMutation,
} = taskApi
