import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'

import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import { setFilters } from '@modules/store/paymentsSlice'
import {
  MONTH_SERVICE_QUERY_PARAM,
  formatMonthServiceParam,
  parseMonthServiceParam,
} from '@utils/helpers'
import {
  DATE_FROM_QUERY_PARAM,
  DATE_TO_QUERY_PARAM,
  applyDateRangeToFilters,
  parseDateRange,
} from '@utils/paymentDateRange'

export function usePaymentsFilterUrlSync({ enabled }: { enabled: boolean }) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const filters = useAppSelector((state) => state.payments.filters)

  const [isUrlApplied, setIsUrlApplied] = useState(!enabled)
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  useEffect(() => {
    if (!enabled || isUrlApplied || !router.isReady) return

    const monthService = parseMonthServiceParam(
      router.query[MONTH_SERVICE_QUERY_PARAM]
    )
    const dateRange = parseDateRange(
      router.query[DATE_FROM_QUERY_PARAM],
      router.query[DATE_TO_QUERY_PARAM]
    )
    if (monthService.length || dateRange) {
      let next = filtersRef.current
      if (monthService.length) {
        next = { ...next, invoiceCreationDate: [], monthService }
      }
      if (dateRange) {
        next = applyDateRangeToFilters(next, dateRange)
      }
      dispatch(setFilters(next))
    }
    setIsUrlApplied(true)
  }, [enabled, isUrlApplied, router.isReady, router.query, dispatch])

  useEffect(() => {
    if (!enabled || !isUrlApplied) return

    const dateRange = parseDateRange(filters?.dateFrom, filters?.dateTo)
    const nextParams: Record<string, string | undefined> = {
      [MONTH_SERVICE_QUERY_PARAM]: formatMonthServiceParam(
        filters?.monthService
      ),
      [DATE_FROM_QUERY_PARAM]: dateRange?.dateFrom,
      [DATE_TO_QUERY_PARAM]: dateRange?.dateTo,
    }

    const query = { ...router.query }
    let changed = false
    for (const [key, nextParam] of Object.entries(nextParams)) {
      const rawParam = query[key]
      const currentParam = Array.isArray(rawParam)
        ? rawParam.join(',')
        : rawParam
      if ((nextParam ?? null) === (currentParam ?? null)) continue

      changed = true
      if (nextParam) {
        query[key] = nextParam
      } else {
        delete query[key]
      }
    }
    if (!changed) return

    router.replace({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    })
  }, [
    enabled,
    isUrlApplied,
    filters?.monthService,
    filters?.dateFrom,
    filters?.dateTo,
    router,
  ])

  return { isUrlApplied }
}
