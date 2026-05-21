import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  IGetCustomServicesResponse,
  IGetCustomDomainServicesResponse,
  IGetCustomServicesRequest,
  IGetCustomServicesByDomainRequest,
  ICreateCustomServiceRequest,
  ICreateCustomServiceResponse,
  IDeleteCustomServiceResponse,
  IDeleteCustomServiceRequest,
  IEditCustomServiceRequest,
  IExtendedCustomService,
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
      query: ({ _id, domainId, templateCategory }) => ({
        url: 'custom-services',
        method: 'GET',
        params: {
          ...(_id ? { _id } : {}),
          ...(domainId ? { domainId } : {}),
          ...(templateCategory ? { templateCategory } : {}),
        },
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
    deleteCustomService: builder.mutation<
      IDeleteCustomServiceResponse,
      IDeleteCustomServiceRequest
    >({
      query: ({ id, domainId }) => ({
        url: 'custom-services',
        method: 'DELETE',
        params: { id, domainId },
      }),
      invalidatesTags: ['CustomService'],
    }),
    editCustomService: builder.mutation<
      IExtendedCustomService,
      IEditCustomServiceRequest
    >({
      query: ({ _id, domainId, ...body }) => ({
        url: 'custom-services',
        method: 'PATCH',
        params: { id: _id, domainId },
        body,
      }),
      invalidatesTags: ['CustomService'],
    }),
  }),
})

export const {
  useGetCustomServicesQuery,
  useGetCustomServicesByDomainQuery,
  useCreateCustomServiceMutation,
  useDeleteCustomServiceMutation,
  useEditCustomServiceMutation,
} = customServicesApi
