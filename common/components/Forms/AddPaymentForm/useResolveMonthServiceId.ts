import { serviceApi, useAddServiceMutation } from '@common/api/serviceApi/service.api'
import {
  isMonthServicePlaceholder,
  parseMonthServicePlaceholder,
} from '@common/components/Forms/AddPaymentForm/month-service-placeholder'
import { useAppDispatch } from '@modules/store/hooks'
import { useCallback } from 'react'

export function useResolveMonthServiceId() {
  const dispatch = useAppDispatch()
  const [addService] = useAddServiceMutation()

  return useCallback(
    async (raw: string, domain: string, street: string) => {
      if (!isMonthServicePlaceholder(raw)) {
        return raw
      }
      const monthStart = parseMonthServicePlaceholder(raw)
      const year = monthStart.year()
      const month = monthStart.month() + 1

      const existing = await dispatch(
        serviceApi.endpoints.getAllServices.initiate(
          {
            domainId: domain,
            streetId: street,
            year,
            month,
            limit: 1,
          },
          { subscribe: false, forceRefetch: true }
        )
      ).unwrap()

      const found = existing.data?.[0]
      if (found?._id) {
        return found._id
      }

      const created = await addService({
        domain,
        street,
        date: monthStart.startOf('month').toDate(),
        rentPrice: 0,
        electricityPrice: 0,
        waterPrice: 0,
        waterPriceTotal: 0,
        description: '',
        customServices: [],
      }).unwrap()

      return created.data._id
    },
    [dispatch, addService]
  )
}
