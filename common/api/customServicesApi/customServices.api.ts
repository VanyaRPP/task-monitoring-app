// customServices.api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  IGetCustomServicesResponse,
  IGetCustomServicesRequest,
  ICustomService,
  ICreateCustomServiceRequest,
  ICreateCustomServiceResponse,
} from './customServices.api.types'

export const customServicesApi = createApi({
  reducerPath: 'customServicesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['CustomService'],
  endpoints: (builder) => ({
    getCustomServices: builder.query<
      IGetCustomServicesResponse,
      IGetCustomServicesRequest
    >({
      query: ({ domainIds }) => ({
        url: 'custom-services',
        params: { domainIds },
      }),
      providesTags: ['CustomService'],
    }),
    createCustomService: builder.mutation<
      ICreateCustomServiceResponse,
      ICreateCustomServiceRequest
    >({
      query: (body) => ({
        url: 'custom-services',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CustomService'],
    }),
  }),
})

export const { useGetCustomServicesQuery, useCreateCustomServiceMutation } =
  customServicesApi
