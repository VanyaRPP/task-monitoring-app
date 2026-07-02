import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ObjectId } from 'mongoose'
import { AllStreetsQuery, BaseQuery, IStreet } from './street.api.types'

export const streetApi = createApi({
  reducerPath: 'streetApi',
  tagTypes: ['Street', 'IStreet'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getCitiesAutocomplete: builder.query<string[], string>({
      query: (search) => ({
        url: 'streets/cities',
        params: { city: search },
      }),
      transformResponse: (res: { data: { city: string }[] }) => {
        const uniqueCities = Array.from(new Set(res.data.map((s) => s.city)))
        return uniqueCities
      },
    }),
    getStreetById: builder.query<BaseQuery, string>({
      query: (id) => `/streets/${id}`,
      providesTags: (result) => ['Street'],
    }),
    getAllStreets: builder.query<
      IStreet[],
      { domainId?: string; limit?: number }
    >({
      query: ({ domainId, limit }: { domainId?: string; limit?: number }) => {
        return {
          url: `streets`,
          method: 'GET',
          params: { domainId, limit },
        }
      },
      providesTags: (response: IStreet[]) =>
        response
          ? [
              ...response.map((item: IStreet) => ({
                type: 'Street' as const,
                id: item._id,
              })),
              { type: 'Street' as const, id: 'LIST' },
            ]
          : [{ type: 'Street' as const, id: 'LIST' }],
      transformResponse: (response: AllStreetsQuery) => response.data,
    }),
    addStreet: builder.mutation<IStreet, Partial<IStreet>>({
      query(body) {
        return {
          url: `streets`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: ['Street', { type: 'Street', id: 'LIST' }],
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
    editStreet: builder.mutation<IStreet, Partial<IStreet>>({
      query: (data) => {
        const { _id, ...body } = data
        return {
          url: `streets/${_id}`,
          method: 'PATCH',
          body,
        }
      },
      invalidatesTags: ['Street'],
    }),
    searchStreets: builder.query<any, { city: string; address: string }>({
      query: ({ city, address }) => ({
        url: 'streets/search',
        params: { city, address },
      }),
    }),
  }),
})

export const {
  useGetAllStreetsQuery,
  useAddStreetMutation,
  useDeleteStreetMutation,
  useEditStreetMutation,
  useGetStreetByIdQuery,
  useGetCitiesAutocompleteQuery,
  useSearchStreetsQuery,
} = streetApi
