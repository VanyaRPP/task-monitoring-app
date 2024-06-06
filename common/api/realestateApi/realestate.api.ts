import { IRealEstate } from '@common/modules/models/RealEstate'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { toCleanObject } from '@utils/toCleanObject'
import {
  GetCompaniesQueryRequest,
  GetCompaniesQueryResponse,
} from './realestate.api.types'

export const realestateApi = createApi({
  reducerPath: 'realestateApi',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['RealEstate'],
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getRealEstates: builder.query<
      GetCompaniesQueryResponse,
      GetCompaniesQueryRequest
    >({
      query: (query) => {
        return {
          url: `real-estate`,
          params: toCleanObject(query),
        }
      },
      providesTags: ['RealEstate'],
    }),
    getRealEstate: builder.query<IRealEstate, string>({
      query: (id) => `real-estate/${id}`,
      providesTags: ['RealEstate'],
    }),
    addRealEstate: builder.mutation<IRealEstate, Partial<IRealEstate>>({
      query(body) {
        return {
          url: `real-estate`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: (response) => (response ? ['RealEstate'] : []),
    }),
    deleteRealEstate: builder.mutation<IRealEstate, IRealEstate['_id']>({
      query(id) {
        return {
          url: `real-estate/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: (response) => (response ? ['RealEstate'] : []),
    }),
    editRealEstate: builder.mutation<IRealEstate, Partial<IRealEstate>>({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `real-estate/${_id}`,
          method: 'PATCH',
          body: body,
        }
      },
      invalidatesTags: (response) => (response ? ['RealEstate'] : []),
    }),
  }),
})

export const {
  useDeleteRealEstateMutation,
  useAddRealEstateMutation,
  useGetRealEstatesQuery,
  useGetRealEstateQuery,
  useEditRealEstateMutation,
} = realestateApi
