import {
  IEmailModel,
  IEmailResponse,
} from '@common/api/emailApi/email.api.types'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const emailApi = createApi({
  reducerPath: 'emailApi',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    email: builder.mutation<IEmailResponse, IEmailModel>({
      query: (data) => ({ url: 'send-email', method: 'POST', body: data }),
    }),
  }),
})

export const { useEmailMutation } = emailApi
