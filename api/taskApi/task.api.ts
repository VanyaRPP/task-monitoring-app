import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ITask } from '../../models/Task'

interface Quer {
    success: boolean
    data: ITask
}

export const taskApi = createApi({
    reducerPath: 'taskApi',
    tagTypes: ['User', 'IUser'],
    refetchOnFocus: true,
    refetchOnReconnect: true,
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3000/api/' }),
    endpoints: (builder) => ({
        getAllTask: builder.query<Quer, string>({
            query: () => '/task',
        }),
        addTask: builder.mutation<ITask, Partial<ITask>>({
            query(data) {
                console.log(data, 'data');
                const { ...body } = data
                return {
                    url: `task?user=62aaff0d18ceccb99ebc5c79`,
                    method: 'POST',
                    body,
                }
            },
            // invalidatesTags: [{ type: 'Post', id: 'LIST' }],
        })
    })
})

export const { useGetAllTaskQuery, useAddTaskMutation } = taskApi