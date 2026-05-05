import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export type DomainSnapshotReason = 'template-switch' | 'manual'

export interface IDomainSnapshotGroup {
  groupName: string
  services: string[]
}

export interface IDomainCustomServicesSnapshot {
  _id: string
  domainId: string
  templateId?: string | null
  templateName?: string | null
  groups: IDomainSnapshotGroup[]
  reason: DomainSnapshotReason
  createdBy?: string | null
  createdAt: string
  updatedAt: string
}

export const domainSnapshotsApi = createApi({
  reducerPath: 'domainSnapshotsApi',
  tagTypes: ['DomainSnapshot'],
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  endpoints: (builder) => ({
    getDomainSnapshots: builder.query<
      IDomainCustomServicesSnapshot[],
      { domainId: string; limit?: number }
    >({
      query: ({ domainId, limit }) => ({
        url: 'domain-snapshots',
        method: 'GET',
        params: { domainId, ...(limit ? { limit } : {}) },
      }),
      providesTags: (result, error, { domainId }) => [
        { type: 'DomainSnapshot', id: domainId },
      ],
      transformResponse: (response: {
        success: boolean
        data: IDomainCustomServicesSnapshot[]
      }) => response.data ?? [],
    }),
    createDomainSnapshot: builder.mutation<
      IDomainCustomServicesSnapshot,
      {
        domainId: string
        reason?: DomainSnapshotReason
        groups?: IDomainSnapshotGroup[]
        templateId?: string | null
        templateName?: string | null
      }
    >({
      query: (body) => ({
        url: 'domain-snapshots',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { domainId }) => [
        { type: 'DomainSnapshot', id: domainId },
      ],
      transformResponse: (response: {
        success: boolean
        data: IDomainCustomServicesSnapshot
      }) => response.data,
    }),
    deleteDomainSnapshot: builder.mutation<
      { deleted: true },
      { _id: string; domainId: string }
    >({
      query: ({ _id }) => ({
        url: `domain-snapshots/${_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { domainId }) => [
        { type: 'DomainSnapshot', id: domainId },
      ],
      transformResponse: (response: {
        success: boolean
        data: { deleted: true }
      }) => response.data,
    }),
    restoreDomainSnapshot: builder.mutation<
      { restored: true; domainId: string; templateId: string | null },
      { _id: string; domainId: string }
    >({
      query: ({ _id }) => ({
        url: `domain-snapshots/${_id}/restore`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { domainId }) => [
        { type: 'DomainSnapshot', id: domainId },
      ],
      transformResponse: (response: {
        success: boolean
        data: {
          restored: true
          domainId: string
          templateId: string | null
        }
      }) => response.data,
    }),
  }),
})

export const {
  useGetDomainSnapshotsQuery,
  useCreateDomainSnapshotMutation,
  useDeleteDomainSnapshotMutation,
  useRestoreDomainSnapshotMutation,
} = domainSnapshotsApi
