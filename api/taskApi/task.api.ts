import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ITask } from '../../models/Task'

interface Quer {
    success: boolean
    data: ITask[]
}

export const taskApi = createApi({
    reducerPath: 'taskApi',
    tagTypes: ['Task', 'User', 'IUser'],
    refetchOnFocus: true,
    refetchOnReconnect: true,
    baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
    endpoints: (builder) => ({
        getAllTask: builder.query<Quer, string>({
            query: () => '/task',
            providesTags: result => ['Task']
        }),
        addTask: builder.mutation<ITask, Partial<ITask>>({
            query(data) {
                console.log(data, 'data');
                const { ...body } = data
                return {
                    url: `task`,
                    method: 'POST',
                    body,
                }
            },
        })
    })
})

export const { useGetAllTaskQuery, useAddTaskMutation } = taskApi