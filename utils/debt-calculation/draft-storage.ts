import { IDebtCalculationSnapshot } from './serialize'

export interface IDebtDraft {
  snapshot: IDebtCalculationSnapshot
  /** ISO stamp of the moment the draft was written to the browser. */
  at: string
}

const PREFIX = 'debt-calculation'

export const draftKey = (domainId?: string, companyId?: string): string =>
  domainId && companyId ? `${PREFIX}:${domainId}:${companyId}` : ''

/**
 * The localStorage draft - the instant tier of persistence, ahead of the DB.
 *
 * Every call is wrapped in try/catch: in a private window, with site data
 * blocked, or on a full quota, access throws, and the page must not go down
 * with it. Losing a draft is a nuisance; losing the page is worse.
 */
export const readDraft = (key: string): IDebtDraft | null => {
  if (!key || typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw) as IDebtDraft

    return parsed?.snapshot && parsed?.at ? parsed : null
  } catch {
    return null
  }
}

export const writeDraft = (
  key: string,
  snapshot: IDebtCalculationSnapshot
): void => {
  if (!key || typeof window === 'undefined') return

  try {
    const draft: IDebtDraft = { snapshot, at: new Date().toISOString() }
    window.localStorage.setItem(key, JSON.stringify(draft))
  } catch {
    // Quota or private mode - the DB still receives the snapshot anyway.
  }
}

export const clearDraft = (key: string): void => {
  if (!key || typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Nothing we can do, and nothing lost.
  }
}

/**
 * Which one to show: the fresher browser draft, or what the DB holds.
 *
 * A newer draft means the last edits never reached the server - dropped
 * connection, closed tab. We take it, and the next autosave pushes the
 * difference to the DB.
 */
export const isDraftNewer = (
  draft: IDebtDraft | null,
  savedAt?: Date | string | null
): boolean => {
  if (!draft) return false
  if (!savedAt) return true

  const draftTime = Date.parse(draft.at)
  const savedTime = Date.parse(String(savedAt))

  if (!Number.isFinite(draftTime)) return false
  if (!Number.isFinite(savedTime)) return true

  return draftTime > savedTime
}
