import { clearDraft, draftKey } from '@utils/debt-calculation/draft-storage'

/**
 * Fired after months are written into a calculation from outside the page
 * (the assistant's photo import).
 *
 * The page applies saved data once per company and then autosaves what it
 * holds, so an open page would quietly write the pre-import months back over
 * the import. On this event it drops its state and reloads instead.
 */
export const DEBT_IMPORTED_EVENT = 'debt-calculation:imported'

export interface IDebtImportedDetail {
  domainId: string
  companyId: string
}

export const announceDebtImport = (detail: IDebtImportedDetail): void => {
  if (typeof window === 'undefined') return

  // The browser draft predates the import; left in place it would win over
  // the database the next time the page opens.
  clearDraft(draftKey(detail.domainId, detail.companyId))
  window.dispatchEvent(new CustomEvent(DEBT_IMPORTED_EVENT, { detail }))
}
