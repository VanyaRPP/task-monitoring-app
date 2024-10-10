import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  IAddRealestateResponse,
  IDeleteRealestateResponse,
  IExtendedArchive,
  IExtendedRealestate,
  IGetRealestateResponse,
  IRealestate,
} from './realestate.api.types'

export const realestateApi = createApi({
  reducerPath: 'realestateApi',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['RealEstate', 'ArchivedApi'],
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getAllRealEstate: builder.query<
      IGetRealestateResponse,
      {
        limit?: number
        domainId?: string[] | string
        streetId?: string[] | string
        companyId?: string[] | string
        archived?: boolean
      }
    >({
      query: ({ limit, companyId, domainId, streetId, archived }) => {
        return {
          url: `real-estate`,
          params: {
            limit,
            companyId,
            domainId,
            streetId,
            archived,
          },
        }
      },
      providesTags: (response) =>
        response
          ? response.data.flatMap((item) => [
              { type: 'RealEstate', id: item._id },
              { type: 'ArchivedApi', id: item._id },
            ])
          : [],
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
    updateArchivedItem: builder.mutation<
      IExtendedArchive,
      Partial<IExtendedArchive>
    >({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `archived/${_id}`,
          method: 'PATCH',
          body: body,
        }
      },
      invalidatesTags: (response) => (response ? ['ArchivedApi'] : []),
    }),
  }),
})

export const {
  useDeleteRealEstateMutation,
  useAddRealEstateMutation,
  useGetAllRealEstateQuery,
  useEditRealEstateMutation,
  useUpdateArchivedItemMutation,
} = realestateApi
