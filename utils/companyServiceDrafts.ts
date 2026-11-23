export interface DraftCompanyServiceEntry {
  _id: string
  label: string
  price: number | null
  isDraft: true
}

export const DRAFT_SERVICE_ID_PREFIX = 'draft:'
export const DEFAULT_DRAFT_SERVICE_NAME = 'Нова послуга'

export const isDraftServiceEntry = (
  entry: unknown
): entry is DraftCompanyServiceEntry =>
  !!entry &&
  typeof entry === 'object' &&
  (entry as { isDraft?: unknown }).isDraft === true

export const createDraftServiceEntry = (): DraftCompanyServiceEntry => ({
  _id: `${DRAFT_SERVICE_ID_PREFIX}${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`,
  label: DEFAULT_DRAFT_SERVICE_NAME,
  price: null,
  isDraft: true,
})

const normalizeName = (name: string) => name.trim().toLowerCase()

export const getDraftServiceNameError = (
  rawName: unknown,
  takenNames: string[] = []
): string | null => {
  const name = typeof rawName === 'string' ? rawName.trim() : ''
  if (!name) return 'Вкажіть назву послуги'
  if (normalizeName(name) === normalizeName(DEFAULT_DRAFT_SERVICE_NAME)) {
    return 'Змініть назву послуги'
  }
  if (
    takenNames.some((taken) => normalizeName(taken) === normalizeName(name))
  ) {
    return 'Послуга з такою назвою вже існує'
  }
  return null
}
