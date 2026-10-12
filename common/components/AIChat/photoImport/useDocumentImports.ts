import { useCallback, useEffect, useRef, useState } from 'react'
import { generateId } from 'ai'
import {
  describeBatch,
  groupStatements,
  IReadPhoto,
  IStatementGroup,
} from './grouping'
import { cropStrip } from './imageTools'
import { readPage, readStrip, surveyPhoto } from './readerApi'
import {
  IPhotoProgress as IReadProgress,
  readStatementPhoto,
} from './readStatementPhoto'

export interface IPhotoProgress extends IReadProgress {
  id: string
  name: string
}

/** What the user did on one statement's card - kept here so it outlives a closed chat window. */
export interface IImportCardState {
  companyId?: string
  domainId?: string
  /** Set once the months went into the company's debt calculation. */
  filled?: { months: number }
  dismissed?: boolean
}

export interface IDocumentBatch {
  id: string
  photos: IPhotoProgress[]
  /** Set while paused on the free tier's per-minute limit. */
  resumeAt?: number
  done: boolean
  groups: IStatementGroup[]
  cards: Record<string, IImportCardState>
}

export interface IQueuedPhoto {
  name: string
  /** The shrunk photo as a data URL. */
  url: string
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Reads batches of statement photos in the background of the chat.
 *
 * A page takes minutes on Groq's free tier (≈20 rows per minute), so the job
 * runs here step by step (see `readStatementPhoto`) instead of in one request.
 * The state lives in the widget, so closing the chat window neither stops the
 * job nor loses the cards.
 */
export function useDocumentImports(
  onBatchDone: (batchId: string, summary: string) => void
) {
  const [batches, setBatches] = useState<Record<string, IDocumentBatch>>({})
  const alive = useRef(true)
  const onDone = useRef(onBatchDone)
  onDone.current = onBatchDone

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const patchBatch = useCallback(
    (id: string, patch: (batch: IDocumentBatch) => IDocumentBatch) => {
      if (!alive.current) return
      setBatches((prev) =>
        prev[id] ? { ...prev, [id]: patch(prev[id]) } : prev
      )
    },
    []
  )

  const start = useCallback(
    (photos: IQueuedPhoto[]): string => {
      const id = generateId()
      const progress: IPhotoProgress[] = photos.map((photo) => ({
        id: generateId(),
        name: photo.name,
        status: 'queued',
        stripsDone: 0,
        stripsTotal: 0,
      }))

      setBatches((prev) => ({
        ...prev,
        [id]: { id, photos: progress, done: false, groups: [], cards: {} },
      }))

      void (async () => {
        const read: IReadPhoto[] = []

        // One photo at a time: they share one per-minute budget anyway.
        for (let index = 0; index < photos.length; index += 1) {
          if (!alive.current) return
          const photoId = progress[index].id

          const result = await readStatementPhoto(photos[index], {
            readPage,
            survey: surveyPhoto,
            readStrip,
            crop: cropStrip,
            wait: async (seconds) => {
              const resumeAt = Date.now() + (seconds + 1) * 1000
              patchBatch(id, (batch) => ({ ...batch, resumeAt }))
              await sleep(resumeAt - Date.now())
              patchBatch(id, (batch) => ({ ...batch, resumeAt: undefined }))
            },
            onProgress: (patch) =>
              patchBatch(id, (batch) => ({
                ...batch,
                photos: batch.photos.map((photo) =>
                  photo.id === photoId ? { ...photo, ...patch } : photo
                ),
              })),
            isCancelled: () => !alive.current,
          })

          if (result) read.push({ ...result, jobId: photoId })
        }

        const groups = groupStatements(read).filter(
          ({ rows }) => rows.length > 0
        )
        const cards = Object.fromEntries(
          groups.map((group) => {
            const suggested = group.candidates.find(
              ({ id: candidateId }) => candidateId === group.suggestedCompanyId
            )
            return [
              group.key,
              { companyId: suggested?.id, domainId: suggested?.domainId },
            ]
          })
        )

        patchBatch(id, (batch) => ({ ...batch, done: true, groups, cards }))
        if (alive.current) {
          onDone.current(id, describeBatch(groups, photos.length - read.length))
        }
      })()

      return id
    },
    [patchBatch]
  )

  const updateCard = useCallback(
    (batchId: string, key: string, patch: Partial<IImportCardState>) =>
      patchBatch(batchId, (batch) => ({
        ...batch,
        cards: {
          ...batch.cards,
          [key]: { ...batch.cards[key], ...patch },
        },
      })),
    [patchBatch]
  )

  return { batches, start, updateCard }
}
