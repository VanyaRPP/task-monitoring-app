import {
  IAddRealestateResponse,
  IGetRealestateResponse,
  IExtendedRealestate,
  IRealestate,
} from './realestate.api.types'

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const realEstateApi = createApi({
  reducerPath: 'realEstateApi',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['RealEstate'],
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getAllRealEstate: builder.query<IExtendedRealestate[], { limit: number }>({
      query: ({ limit }) => {
        return {
          url: `real-estate`,
          params: { limit },
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
  }),
})

export const { useGetAllRealEstateQuery, useAddRealEstateMutation } =
  realEstateApi
