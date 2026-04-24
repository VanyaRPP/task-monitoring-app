import {
  useCreateCustomServiceMutation,
  useGetCustomServicesQuery,
} from '@common/api/customServicesApi/customServices.api'
import { message } from 'antd'
import { useCallback, useMemo } from 'react'

function catalogFromQuery(data: unknown): any[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (typeof data === 'object' && data !== null && 'data' in data) {
    const inner = (data as { data: unknown }).data
    return Array.isArray(inner) ? inner : []
  }
  return []
}

export function useResolveServiceId(domainId: string | undefined) {
  const [createCustomService] = useCreateCustomServiceMutation()
  const { data: customServicesData } = useGetCustomServicesQuery({})

  const catalogServices = useMemo(
    () => catalogFromQuery(customServicesData),
    [customServicesData]
  )

  const resolveByName = useCallback(
    async (name: string | undefined): Promise<string | undefined> => {
      const trimmed = name?.trim()
      if (!trimmed) return undefined
      const existing = catalogServices.find(
        (s: { name?: string }) => s.name === trimmed
      )
      if (existing) return String(existing._id)
      try {
        const result = await createCustomService({
          domainId: domainId || '',
          name: trimmed,
        }).unwrap()
        return String(result.data._id)
      } catch (e) {
        console.error('useResolveServiceId: create failed', e)
        message.error('Помилка створення послуги за назвою')
        return undefined
      }
    },
    [catalogServices, createCustomService, domainId]
  )

  return { resolveByName, catalogServices }
}
