import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { customServicesApi } from '@common/api/customServicesApi/customServices.api'
import {
  IDomainModel,
  IExtendedDomain,
  IExtendedArchivedDomain,
  IDeleteDomainResponse,
  IAddDomainResponse,
  IGetDomainResponse,
  IExtendedAreas,
  IGetAreasResponse,
  IGetDomainByPkResponse,
  IDomainTypeTemplate,
  IDomainTypeTemplateGroup,
  IDomainTypeTemplateWithUsage,
  DomainTypeTemplateCategory,
} from './domain.api.types'

export const domainApi = createApi({
  reducerPath: 'domainApi',
  tagTypes: ['Domain', 'IDomain', 'DomainTypeTemplate', 'ArchivedDomain'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getDomains: builder.query<
      IExtendedDomain[],
      {
        limit?: number
        streetId?: string
        domainId?: string
        archived?: boolean
      }
    >({
      query: ({ limit, streetId, domainId, archived }) => {
        return {
          url: `domain`,
          method: 'GET',
          params: { limit, streetId, domainId, archived },
        }
      },
      providesTags: (response) =>
        response
          ? [
              ...response.flatMap((item) => [
                { type: 'Domain' as const, id: item._id },
                { type: 'ArchivedDomain' as const, id: item._id },
              ]),
              { type: 'Domain' as const, id: 'LIST' },
            ]
          : [{ type: 'Domain' as const, id: 'LIST' }],
      transformResponse: (response: IGetDomainResponse) => response.data,
    }),
    getDomainsByAdmin: builder.query<
      IExtendedDomain[],
      { archived?: boolean } | void
    >({
      query: (arg) => ({
        url: `domain/admin`,
        method: 'GET',
        params:
          arg && arg.archived !== undefined ? { archived: arg.archived } : {},
      }),
      providesTags: (response) =>
        response
          ? [
              ...response.flatMap((item) => [
                { type: 'Domain' as const, id: item._id },
                { type: 'ArchivedDomain' as const, id: item._id },
              ]),
              { type: 'Domain' as const, id: 'LIST' },
            ]
          : [{ type: 'Domain' as const, id: 'LIST' }],
      transformResponse: (response: IGetDomainResponse) => response.data,
    }),
    addDomain: builder.mutation<IAddDomainResponse, IDomainModel>({
      query(data) {
        const { ...body } = data

        return {
          url: 'domain',
          method: 'POST',
          body,
        }
      },
      invalidatesTags: (response) =>
        response ? [{ type: 'Domain', id: 'LIST' }] : [],
    }),
    deleteDomain: builder.mutation<
      IDeleteDomainResponse,
      IExtendedDomain['_id']
    >({
      query(id) {
        return {
          url: `domain/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: (response, error, id) =>
        response
          ? [
              { type: 'Domain', id },
              { type: 'Domain', id: 'LIST' },
            ]
          : [],
    }),
    editDomain: builder.mutation<IExtendedDomain, Partial<IExtendedDomain>>({
      query(data) {
        const { _id, ...body } = data
        return {
          url: `domain/${_id}`,
          method: 'PATCH',
          body: body,
        }
      },
      invalidatesTags: (response, error, arg) =>
        response
          ? [
              { type: 'Domain', id: arg._id },
              { type: 'Domain', id: 'LIST' },
            ]
          : [],
    }),
    updateArchivedDomain: builder.mutation<
      IExtendedDomain,
      Partial<IExtendedArchivedDomain>
    >({
      query: ({ _id, ...body }) => ({
        url: `domain/${_id}/archive`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (response, error, arg) =>
        response
          ? [
              { type: 'ArchivedDomain', id: arg._id },
              { type: 'Domain', id: 'LIST' },
            ]
          : [],
                async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        // Domain edits may reshape customServices groups; force the
        // customServicesApi cache to refresh so Payment Bulk + RealEstateModal
        // see the new structure without a manual reload.
        try {
          await queryFulfilled
          dispatch(customServicesApi.util.invalidateTags(['CustomService']))
        } catch {
          // mutation failed — nothing to invalidate
        }
      },
    }),
    getAreas: builder.query<IExtendedAreas, { domainId?: string }>({
      query: ({ domainId }) => ({
        url: `domain/areas/${domainId}`,
        method: 'GET',
      }),
      providesTags: (result, error, { domainId }) => [
        { type: 'IDomain', id: domainId || '' },
      ],
      transformResponse: (response: IGetAreasResponse) => response.data,
    }),
    getDomainByPk: builder.query<IExtendedDomain, { domainId?: string }>({
      query: ({ domainId }) => ({
        url: `domain/${domainId}`,
        method: 'GET',
      }),
      providesTags: (result, error, { domainId }) => [
        { type: 'Domain', id: domainId },
      ],
      transformResponse: (response: IGetDomainByPkResponse) => response.data,
    }),
    getDomainTypeTemplates: builder.query<
      IDomainTypeTemplate[],
      { includeArchived?: boolean } | void
    >({
      query: (arg) => ({
        url: 'domain-type-templates',
        method: 'GET',
        params:
          arg && 'includeArchived' in arg && arg.includeArchived
            ? { includeArchived: 'true' }
            : {},
      }),
      providesTags: ['DomainTypeTemplate'],
      transformResponse: (response: {
        success: boolean
        data: IDomainTypeTemplate[]
      }) => response.data ?? [],
    }),
    getDomainTypeTemplateById: builder.query<
      IDomainTypeTemplateWithUsage,
      string
    >({
      query: (id) => ({
        url: `domain-type-templates/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'DomainTypeTemplate', id }],
      transformResponse: (response: {
        success: boolean
        data: IDomainTypeTemplateWithUsage
      }) => response.data,
    }),
    addDomainTypeTemplate: builder.mutation<
      IDomainTypeTemplate,
      {
        name: string
        groups: IDomainTypeTemplateGroup[]
        category?: DomainTypeTemplateCategory
      }
    >({
      query: (body) => ({
        url: 'domain-type-templates',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DomainTypeTemplate'],
      transformResponse: (response: {
        success: boolean
        data: IDomainTypeTemplate
      }) => response.data,
    }),
    editDomainTypeTemplate: builder.mutation<
      IDomainTypeTemplate,
      {
        _id: string
        name?: string
        category?: DomainTypeTemplateCategory
        groups?: IDomainTypeTemplateGroup[]
      }
    >({
      query: ({ _id, ...body }) => ({
        url: `domain-type-templates/${_id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { _id }) => [
        'DomainTypeTemplate',
        { type: 'DomainTypeTemplate', id: _id },
      ],
      transformResponse: (response: {
        success: boolean
        data: IDomainTypeTemplate
      }) => response.data,
    }),
    deleteDomainTypeTemplate: builder.mutation<
      { archived?: boolean; deleted?: boolean; usageCount: number },
      { _id: string; force?: boolean; archive?: boolean }
    >({
      query: ({ _id, force, archive }) => ({
        url: `domain-type-templates/${_id}`,
        method: 'DELETE',
        params: {
          ...(force ? { force: 'true' } : {}),
          ...(archive ? { archive: 'true' } : {}),
        },
      }),
      invalidatesTags: ['DomainTypeTemplate'],
      transformResponse: (response: {
        success: boolean
        data: { archived?: boolean; deleted?: boolean; usageCount: number }
      }) => response.data,
    }),
    cloneDomainTypeTemplateForDomain: builder.mutation<
      {
        groups: { groupName: string; services: string[] }[]
        clonedCount: number
        missingCount: number
      },
      { _id: string; domainId: string }
    >({
      query: ({ _id, domainId }) => ({
        url: `domain-type-templates/${_id}/clone-for-domain`,
        method: 'POST',
        body: { domainId },
      }),
      transformResponse: (response: {
        success: boolean
        data: {
          groups: { groupName: string; services: string[] }[]
          clonedCount: number
          missingCount: number
        }
      }) => response.data,
    }),
  }),
})

export const {
  useGetAreasQuery,
  useGetDomainsQuery,
  useAddDomainMutation,
  useDeleteDomainMutation,
  useEditDomainMutation,
  useUpdateArchivedDomainMutation,
  useGetDomainByPkQuery,
  useGetDomainsByAdminQuery,
  useGetDomainTypeTemplatesQuery,
  useGetDomainTypeTemplateByIdQuery,
  useAddDomainTypeTemplateMutation,
  useEditDomainTypeTemplateMutation,
  useDeleteDomainTypeTemplateMutation,
  useCloneDomainTypeTemplateForDomainMutation,
} = domainApi
