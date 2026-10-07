/**
 * Shapes shared by the photo-import API and the chat widget, so this file
 * must stay free of server-only imports.
 */

/** A photo can hold one of these. Only debt statements are wired up so far. */
export type DocumentKind = 'debtMonthlyStatement' | 'unknown'

/** Whatever the statement's header says about whose debt it is. */
export interface IStatementHeader {
  /** E.g. «вул. Покровська буд. 149 кв. 72». */
  address: string | null
  apartment: string | null
  ownerName: string | null
  accountNumber: string | null
}

export interface ICompanyCandidate {
  id: string
  companyName: string
  domainId: string
  domainName: string
}

/** The first look at a photo: what, whose, and how to cut it into strips. */
export interface IDocumentSurvey {
  documentType: DocumentKind
  header: IStatementHeader
  /** How many month rows the table holds - plans the strips. */
  rowCount: number
  /** Companies the header points to, best first. */
  candidates: ICompanyCandidate[]
  /** Set only when one candidate clearly beats the rest. */
  suggestedCompanyId: string | null
}

/**
 * The chat message part standing in for a batch of photos:
 * `data-${DOCUMENT_BATCH_PART}`. The batch itself lives in the widget; the
 * part carries its id, and a text summary once it is read - that summary is
 * what the chat model sees in the history.
 */
export const DOCUMENT_BATCH_PART = 'documentBatch'

export interface IDocumentBatchPart {
  batchId: string
  summary?: string
}
