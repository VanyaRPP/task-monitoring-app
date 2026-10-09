import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { invalidateDebtorsOnSuccess } from '@common/api/debtorsApi/debtors.api'
import { serviceApi } from '@common/api/serviceApi/service.api'
import {
  IDomainIndexesResponse,
  IDomainOverrideRequest,
  IInflationIndex,
  IInflationIndexInput,
  IInflationIndexRange,
  IInflationIndexResponse,
  ISetDomainOverrideRequest,
} from './inflationIndex.api.types'

const refreshDependants = async (
  arg: unknown,
  api: {
    dispatch: (action: any) => any
    queryFulfilled: Promise<unknown>
  }
): Promise<void> => {
  await invalidateDebtorsOnSuccess(arg, api)
  try {
    await api.queryFulfilled
    api.dispatch(serviceApi.util.invalidateTags(['Service']))
  } catch {}
}

export const inflationIndexApi = createApi({
  reducerPath: 'inflationIndexApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['InflationIndex', 'DomainInflationIndex'],
  endpoints: (builder) => ({
    getInflationIndexes: builder.query<
      IInflationIndex[],
      IInflationIndexRange | undefined
    >({
      query: (range) => {
        const params = new URLSearchParams()
        if (range?.from) params.set('from', range.from)
        if (range?.to) params.set('to', range.to)
        if (range?.domainId) params.set('domainId', range.domainId)
        const qs = params.toString()

        return `inflation-index${qs ? `?${qs}` : ''}`
      },
      transformResponse: (response: IInflationIndexResponse) => response.data,
      providesTags: ['InflationIndex'],
    }),

    saveInflationIndexes: builder.mutation<
      IInflationIndex[],
      IInflationIndexInput[]
    >({
      query: (items) => ({
        url: 'inflation-index',
        method: 'POST',
        body: { items },
      }),
      transformResponse: (response: IInflationIndexResponse) => response.data,
      invalidatesTags: ['InflationIndex', 'DomainInflationIndex'],
    }),

    getDomainInflationIndexes: builder.query<
      IDomainIndexesResponse['data'],
      { domainId: string; from?: string; to?: string }
    >({
      query: ({ domainId, from, to }) => ({
        url: 'inflation-index/domain',
        params: { domainId, from, to },
      }),
      transformResponse: (response: IDomainIndexesResponse) => response.data,
      providesTags: ['DomainInflationIndex'],
    }),

    setDomainInflationOverride: builder.mutation<
      unknown,
      ISetDomainOverrideRequest
    >({
      query: (body) => ({
        url: 'inflation-index/domain',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['DomainInflationIndex', 'InflationIndex'],
      onQueryStarted: refreshDependants,
    }),

    resetDomainInflationOverride: builder.mutation<
      unknown,
      IDomainOverrideRequest
    >({
      query: (params) => ({
        url: 'inflation-index/domain',
        method: 'DELETE',
        params,
      }),
      invalidatesTags: ['DomainInflationIndex', 'InflationIndex'],
      onQueryStarted: refreshDependants,
    }),
  }),
})

export const {
  useGetInflationIndexesQuery,
  useSaveInflationIndexesMutation,
  useGetDomainInflationIndexesQuery,
  useSetDomainInflationOverrideMutation,
  useResetDomainInflationOverrideMutation,
} = inflationIndexApi
