import { useSaveDebtCalculationMutation } from '@common/api/debtCalculationApi/debtCalculation.api'
import { draftKey, writeDraft } from '@utils/debt-calculation/draft-storage'
import { IDebtCalculationSnapshot } from '@utils/debt-calculation/serialize'
import { useEffect, useRef, useState } from 'react'

export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

export interface IAutoSave {
  saveState: SaveState
  /** When the snapshot last made it to the database. */
  savedAt?: Date
}

/** The pause in typing after which the snapshot goes to the server. */
export const AUTOSAVE_DELAY_MS = 1500

export interface IUseAutoSaveArgs {
  domainId?: string
  companyId?: string
  snapshot: IDebtCalculationSnapshot
  /** While data is still loading there is nothing to save - we would overwrite it. */
  enabled: boolean
}

/**
 * Two-tier autosave: a localStorage draft immediately, the database after a
 * pause in typing.
 *
 * There is no Save button by design. The browser tier survives a closed tab or
 * a dropped connection; the server tier makes the data reachable from another
 * machine.
 */
export const useAutoSave = ({
  domainId,
  companyId,
  snapshot,
  enabled,
}: IUseAutoSaveArgs): IAutoSave => {
  const [saveCalculation] = useSaveDebtCalculationMutation()
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [savedAt, setSavedAt] = useState<Date | undefined>()

  const snapshotJson = JSON.stringify(snapshot)
  // The snapshot the server already holds. Kept in a ref so updating it does
  // not restart the effect and spin up an endless save loop.
  const committed = useRef<string | null>(null)
  // Edits that the debounce has not flushed yet.
  const pending = useRef<IDebtCalculationSnapshot | null>(null)

  useEffect(() => {
    return () => {
      // Switching company cancels the debounce timer below, so whatever was
      // typed in the last moment would live only in the browser draft. Send it
      // now: the snapshot carries its own domain and company, so a late save
      // still lands on the right record.
      const unsaved = pending.current
      if (!unsaved) return

      pending.current = null
      saveCalculation(unsaved)
    }
  }, [domainId, companyId, saveCalculation])

  useEffect(() => {
    // A different company means a different record; the next snapshot has nothing to compare against.
    committed.current = null
    setSaveState('idle')
    setSavedAt(undefined)
  }, [domainId, companyId])

  useEffect(() => {
    if (!enabled || !domainId || !companyId) return

    // The first snapshot after loading IS what is already saved.
    if (committed.current === null) {
      committed.current = snapshotJson
      return
    }

    if (committed.current === snapshotJson) return

    writeDraft(draftKey(domainId, companyId), snapshot)
    pending.current = snapshot
    setSaveState('pending')

    const timer = setTimeout(async () => {
      setSaveState('saving')
      try {
        await saveCalculation(snapshot).unwrap()
        committed.current = snapshotJson
        pending.current = null
        setSavedAt(new Date())
        setSaveState('saved')
      } catch {
        // The state stays 'error' and the draft is already in the browser, so
        // the next edit retries and nothing is lost.
        setSaveState('error')
      }
    }, AUTOSAVE_DELAY_MS)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotJson, enabled, domainId, companyId])

  return { saveState, savedAt }
}
