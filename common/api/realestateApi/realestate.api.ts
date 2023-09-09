import {
  IDeleteRealestateResponse,
  IAddRealestateResponse,
  IGetRealestateResponse,
  IExtendedRealestate,
  IRealestate,
} from './realestate.api.types'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const realestateApi = createApi({
  reducerPath: 'realestateApi',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['RealEstate'],
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getAllRealEstate: builder.query<
      IExtendedRealestate[],
      {
        limit?: number
        domainId?: string
        streetId?: string
        companyId?: string
      }
    >({
      query: ({ limit, companyId, domainId, streetId }) => {
        return {
          url: `real-estate`,
          params: { limit, companyId, domainId, streetId },
        }
      },
      providesTags: (response) =>
        response
          ? response.map((item) => ({ type: 'RealEstate', id: item._id }))
          : [],
      transformResponse: (response: IGetRealestateResponse) => response.data,
    }),

    addRealEstate: builder.mutation<IAddRealestateResponse, IRealestate>({
      query(body) {
        return {
          url: `real-estate`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: (response) => (response ? ['RealEstate'] : []),
    }),
    deleteRealEstate: builder.mutation<
      IDeleteRealestateResponse,
      IExtendedRealestate['_id']
    >({
      query(id) {
        return {
          url: `real-estate/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: (response) => (response ? ['RealEstate'] : []),
    }),
    editRealEstate: builder.mutation<
      IExtendedRealestate,
      Partial<IExtendedRealestate>
    >({
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
  useGetAllRealEstateQuery,
  useEditRealEstateMutation,
} = realestateApi
