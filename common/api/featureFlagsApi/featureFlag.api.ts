import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { IFeatureFlag } from './featureFlag.api.types'

export const FeatureFlagApi = createApi({
  reducerPath: 'featureFlagsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['FeatureFlag'],
  endpoints: (builder) => ({
    getFeatureFlags: builder.query<IFeatureFlag[], void>({
      query: () => 'feature-flags',
      transformResponse: (response: {
        success: boolean
        data: IFeatureFlag[]
      }) => response.data,
      providesTags: ['FeatureFlag'],
    }),

    getFeatureFlagByName: builder.query<boolean, string>({
      query: (name) => `feature-flags/by-name/${name}`,
      transformResponse: (response: { success: boolean; data: IFeatureFlag }) =>
        response.data.isEnabled,
      providesTags: ['FeatureFlag'],
    }),

    updateFeatureFlag: builder.mutation<
      IFeatureFlag,
      { id: string; data: Partial<IFeatureFlag> }
    >({
      query: ({ id, data }) => ({
        url: `feature-flags/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['FeatureFlag'],
    }),

    addFeatureFlag: builder.mutation<IFeatureFlag, Partial<IFeatureFlag>>({
      query: (body) => ({
        url: 'feature-flags',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FeatureFlag'],
    }),

    editFeatureFlag: builder.mutation<IFeatureFlag, Partial<IFeatureFlag>>({
      query: (data) => {
        const { _id, ...body } = data
        return {
          url: `feature-flags/${_id}`,
          method: 'PATCH',
          body,
        }
      },
      invalidatesTags: ['FeatureFlag'],
    }),

    deleteFeatureFlag: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `feature-flags/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FeatureFlag'],
    }),
  }),
})

export const {
  useGetFeatureFlagByNameQuery,
  useUpdateFeatureFlagMutation,
  useDeleteFeatureFlagMutation,
  useEditFeatureFlagMutation,
  useAddFeatureFlagMutation,
  useGetFeatureFlagsQuery,
} = FeatureFlagApi
