import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ObjectId } from 'mongoose'
import { ICreateTask, ITask, ItaskExecutors } from '../../modules/models/Task'

interface IAcceptQuery {
  taskId: ObjectId | string
  workerId: ObjectId | string
}

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
    deleteTask: builder.mutation<{ success: boolean; id: ObjectId }, string>({
      query(id) {
        return {
          url: `task/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: ['Task'],
    }),
    addTaskExecutor: builder.mutation<TaskQuer, ItaskExecutors>({
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
} = taskApi
