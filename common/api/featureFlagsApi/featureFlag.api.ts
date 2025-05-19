import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const FeatureFlag = createApi({
  reducerPath: 'featureFlagsApe',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['FeatureFlag'],
  endpoints: (builder) => ({
    getFeatureFlags: builder.query<any[], void>({
      query: () => 'feature-flags',
      transformResponse: (response: { success: boolean; data: any[] }) => response.data,
      providesTags: ['FeatureFlag'],
    }),
    updateFeatureFlag: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `feature-flags/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['FeatureFlag'],
    }),
  }),
})

export const {
  useGetFeatureFlagsQuery,
  useUpdateFeatureFlagMutation,
} = FeatureFlag
