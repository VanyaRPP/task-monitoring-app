import { useCallback, useEffect, useState } from 'react'
import {
  DATE_RANGE_HISTORY_STORAGE_KEY,
  DateHistoryItem,
  DateRangeHistoryStore,
  addDateRangeToHistory,
  emptyDateRangeHistory,
  getDateRangeHistory,
  readDateRangeHistory,
  writeDateRangeHistory,
} from '@utils/dateRangeHistory'
import { PaymentDateRange } from '@utils/paymentDateRange'

export interface UseDateRangeHistoryResult {
  items: DateHistoryItem[]
  record: (range: PaymentDateRange) => void
}

/** Recent date ranges for one scope, persisted in localStorage. */
export function useDateRangeHistory(scope: string): UseDateRangeHistoryResult {
  // Starts empty and loads in an effect so SSR and the first client render match.
  const [store, setStore] = useState<DateRangeHistoryStore>(
    emptyDateRangeHistory
  )

  useEffect(() => {
    setStore(readDateRangeHistory())

    const onStorage = (event: StorageEvent) => {
      if (event.key === DATE_RANGE_HISTORY_STORAGE_KEY) {
        setStore(readDateRangeHistory())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const record = useCallback(
    (range: PaymentDateRange) => {
      // Re-read so a write from another tab is not overwritten.
      const next = addDateRangeToHistory(readDateRangeHistory(), scope, range)
      writeDateRangeHistory(next)
      setStore(next)
    },
    [scope]
  )

  return { items: getDateRangeHistory(store, scope), record }
}
