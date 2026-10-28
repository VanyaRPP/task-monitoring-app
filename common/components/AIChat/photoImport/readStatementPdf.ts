import { parseStatementCells } from '@utils/debt-calculation/statement'
import type { IReadPhoto } from './grouping'
import type { IPdfReadResult, ReadOutcome } from './readerApi'
import type { IPhotoProgress } from './readStatementPhoto'

export interface IReadPdfDeps {
  readPdf: (file: string) => Promise<ReadOutcome<IPdfReadResult>>
  onProgress: (patch: Partial<IPhotoProgress>) => void
}

/**
 * Reads one statement PDF into what a read photo gives: its header, the
 * companies it may belong to, and its rows - a page per strip. The rows are
 * parsed by the same `parseStatementCells` as a photo's, so from here on the
 * import (grouping, checks, the card, the debt calculation) cannot tell a
 * PDF from a photo. `null` when the file is not a statement or could not be
 * read - its progress says which.
 */
export async function readStatementPdf(
  file: { name: string; url: string },
  deps: IReadPdfDeps
): Promise<IReadPhoto | null> {
  deps.onProgress({ status: 'reading', stripsDone: 0, stripsTotal: 1 })

  const outcome = await deps.readPdf(file.url)
  if (!outcome.ok) {
    deps.onProgress({
      status: 'failed',
      error: outcome.message ?? 'Не вдалося прочитати PDF',
    })
    return null
  }

  const pdf = outcome.data
  if (!pdf.hasText) {
    deps.onProgress({
      status: 'failed',
      error: 'У PDF немає тексту (це скан) — надішліть його сторінки як фото.',
    })
    return null
  }
  if (pdf.documentType !== 'debtMonthlyStatement') {
    deps.onProgress({ status: 'unrecognized' })
    return null
  }

  const parsed = pdf.pages.map((rows) => parseStatementCells(pdf.columns, rows))
  deps.onProgress({ status: 'done', stripsDone: 1, stripsTotal: 1 })

  return {
    jobId: '',
    name: file.name,
    header: pdf.header,
    candidates: pdf.candidates,
    suggestedCompanyId: pdf.suggestedCompanyId,
    strips: parsed.map(({ rows }) => rows),
    issues: parsed.flatMap(({ issues }) => issues),
  }
}
