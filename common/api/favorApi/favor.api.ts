import {
  IAddFavorResponse,
  IDeleteFavorResponse,
  IExtendedFavor,
  IGetFavorResponse,
  IFavor,
} from './favor.api.types'

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const favorApi = createApi({
  reducerPath: 'favorApi',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['Favor'],
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getAllFavors: builder.query<
      IExtendedFavor[],
      { limit: number; userId?: string }
    >({
      query: ({ limit, userId }) => {
        return {
          url: `favor`,
          params: { limit, userId },
        }
      },
      providesTags: (response) =>
        response
          ? response.map((item) => ({ type: 'Favor', id: item._id }))
          : [],
      transformResponse: (response: IGetFavorResponse) => response.data,
    }),
    addFavor: builder.mutation<IAddFavorResponse, IFavor>({
      query(body) {
        return {
          url: `favor`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: (response) => (response ? ['Favor'] : []),
    }),
    deleteFavor: builder.mutation<IDeleteFavorResponse, IExtendedFavor['_id']>({
      query(id) {
        return {
          url: `favor/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: (response) => (response ? ['Favor'] : []),
    }),
  }),
})

export const {
  useAddFavorMutation,
  useGetAllFavorsQuery,
  useDeleteFavorMutation,
} = favorApi
