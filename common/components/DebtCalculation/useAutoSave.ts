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
    setSaveState('pending')

    const timer = setTimeout(async () => {
      setSaveState('saving')
      try {
        await saveCalculation(snapshot).unwrap()
        committed.current = snapshotJson
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
