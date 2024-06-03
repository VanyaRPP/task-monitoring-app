import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { toCleanObject } from '@utils/toCleanObject'
import { ObjectId } from 'mongoose'
import {
  GetStreetsQueryRequest,
  GetStreetsQueryResponse,
  IStreet,
} from './street.api.types'

export const streetApi = createApi({
  reducerPath: 'streetApi',
  tagTypes: ['Street'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getStreet: builder.query<IStreet, string>({
      query: (id) => `/streets/${id}`,
      providesTags: ['Street'],
    }),
    getStreets: builder.query<GetStreetsQueryResponse, GetStreetsQueryRequest>({
      query: (query) => {
        return {
          url: `streets`,
          params: toCleanObject(query),
        }
      },
      providesTags: ['Street'],
    }),
    addStreet: builder.mutation<IStreet, Partial<IStreet>>({
      query(body) {
        return {
          url: `streets`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: ['Street'],
    }),
    editStreet: builder.mutation<IStreet, Partial<IStreet>>({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `streets/${_id}`,
          method: 'PATCH',
          body,
        }
      },
      invalidatesTags: ['Street'],
    }),
    deleteStreet: builder.mutation<{ success: boolean; id: ObjectId }, string>({
      query(id) {
        return {
          url: `streets/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: ['Street'],
    }),
  }),
})

export const {
  useGetStreetQuery,
  useGetStreetsQuery,
  useAddStreetMutation,
  useEditStreetMutation,
  useDeleteStreetMutation,
} = streetApi
