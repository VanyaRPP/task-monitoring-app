import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ObjectId } from 'mongoose'
import { AllStreetsQuery, BaseQuery, IStreet } from './street.api.types'
import { PageEvent } from 'puppeteer'

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
			{ data: IStreet[]; totalCount: number },
			{ domainId?: string; page?: number; limit?: number }
		>({
			query: ({ domainId, page = 1, limit = 10 }: { domainId?: string; page?: number, limit?: number }) => {
				return {
					url: `streets`,
					method: 'GET',
					params: { domainId, page, limit },
				}
			},
			providesTags: (response) =>
				response?.data
					? response.data.map((item: IStreet) => ({
						type: 'Street',
						id: item._id,
					}))
					: [],
			transformResponse: (response: AllStreetsQuery) => ({
				data: response.data,
				totalCount: response.totalCount,
			}),
		}),
		addStreet: builder.mutation<IStreet, Partial<IStreet>>({
			query(body) {
				return {
					url: `streets`,
					method: 'POST',
					body,
				}
			},
			invalidatesTags: ['Street'],
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
