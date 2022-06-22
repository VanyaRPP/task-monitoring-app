import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ITask } from '../../models/Task'

interface Quer {
    success: boolean
    data: ITask
}

export const userApi = createApi({
    reducerPath: 'userApi',
    tagTypes: ['User', 'IUser'],
    refetchOnFocus: true,
    refetchOnReconnect: true,
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3000/api/' }),
    endpoints: (builder) => ({
        getAllTask: builder.query<Quer, string>({
            query: () => '/task',
        }),
        addTask: builder.mutation<ITask, Partial<ITask>>({
            query: (body) => ({
                url: 'task',
                method: 'POST',
                body,
            }),
            // invalidatesTags: [{ type: 'Post', id: 'LIST' }],
        })
    })
})

export const { useGetAllTaskQuery, useAddTaskMutation } = userApi