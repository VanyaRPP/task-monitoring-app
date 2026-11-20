import type { IRealestate } from '@common/api/realestateApi/realestate.api.types'

interface NoteLookupKey {
  serviceId?: unknown
  fieldName?: string | null
}

export const findServiceNote = (
  company: Pick<IRealestate, 'customServices'> | null | undefined,
  { serviceId, fieldName }: NoteLookupKey
): string | undefined => {
  const entries = company?.customServices
  if (!Array.isArray(entries) || entries.length === 0) return undefined

  const id = serviceId ? String(serviceId) : undefined
  const entry =
    (id ? entries.find((s) => String(s._id) === id) : undefined) ??
    (fieldName ? entries.find((s) => s.fieldName === fieldName) : undefined)

  const note = entry?.note
  return typeof note === 'string' && note.trim() ? note : undefined
}
