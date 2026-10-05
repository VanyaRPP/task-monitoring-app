import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'

import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import { setFilters } from '@modules/store/paymentsSlice'
import {
  MONTH_SERVICE_QUERY_PARAM,
  formatMonthServiceParam,
  parseMonthServiceParam,
} from '@utils/helpers'

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
    if (monthService.length) {
      dispatch(
        setFilters({
          ...filtersRef.current,
          invoiceCreationDate: [],
          monthService,
        })
      )
    }
    setIsUrlApplied(true)
  }, [enabled, isUrlApplied, router.isReady, router.query, dispatch])

  useEffect(() => {
    if (!enabled || !isUrlApplied) return

    const nextParam = formatMonthServiceParam(filters?.monthService)
    const rawParam = router.query[MONTH_SERVICE_QUERY_PARAM]
    const currentParam = Array.isArray(rawParam) ? rawParam.join(',') : rawParam
    if ((nextParam ?? null) === (currentParam ?? null)) return

    const query = { ...router.query }
    if (nextParam) {
      query[MONTH_SERVICE_QUERY_PARAM] = nextParam
    } else {
      delete query[MONTH_SERVICE_QUERY_PARAM]
    }
    router.replace({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    })
  }, [enabled, isUrlApplied, filters?.monthService, router])

  return { isUrlApplied }
}
