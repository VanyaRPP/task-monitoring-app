import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { IGetDebtorsResponse, IGetDebtorsRequest } from './debtors.api.types'

export const debtorsApi = createApi({
  reducerPath: 'debtorsApi',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['Debtors'],
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getDebtors: builder.query<IGetDebtorsResponse, IGetDebtorsRequest>({
      query: ({ domainIds }) => {
        return {
          url: `debtors`,
          params: { domainIds },
        }
      },
      providesTags: ['Debtors'],
    }),
  }),
})
export const { useGetDebtorsQuery } = debtorsApi

/**
 * Use as `onQueryStarted` on any mutation that should refresh the debtors badge
 * after success. Cross-API invalidation can't be expressed via `invalidatesTags`
 * since `Debtors` lives outside the calling API.
 */
export const invalidateDebtorsOnSuccess = async (
  _arg: unknown,
  {
    dispatch,
    queryFulfilled,
  }: {
    dispatch: (action: any) => any
    queryFulfilled: Promise<unknown>
  }
): Promise<void> => {
  try {
    await queryFulfilled
    dispatch(debtorsApi.util.invalidateTags(['Debtors']))
  } catch {
    // mutation failed; nothing to invalidate
  }
}
