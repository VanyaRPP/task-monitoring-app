import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  IGetCustomServicesResponse,
  IGetCustomDomainServicesResponse,
  IGetCustomServicesRequest,
  IGetCustomServicesByDomainRequest,
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
      query: ({ _id }) => ({
        url: 'custom-services',
        params: { _id },
      }),
      providesTags: ['CustomService'],
    }),
    getCustomServicesByDomain: builder.query<
      IGetCustomDomainServicesResponse,
      IGetCustomServicesByDomainRequest
    >({
      query: ({ domainId }) => ({
        url: 'custom-services/domain',
        params: { domainId },
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

export const { 
  useGetCustomServicesQuery,
  useGetCustomServicesByDomainQuery,
  useCreateCustomServiceMutation } =
  customServicesApi
