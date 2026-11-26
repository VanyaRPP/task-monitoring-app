import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import type { IService } from '@common/api/serviceApi/service.api.types'
import type { IDomainOption } from '@components/InflationOverridePanel'
import {
  filterByAddress,
  getAddressOptions,
  IAddressOption,
  MonthPeriod,
} from '@utils/serviceMonths'
import { useEffect, useMemo, useState } from 'react'

export interface IServiceHistoryOptions {
  domains: IDomainOption[]
  /** The domain and address picked in the table filters, if it is just one. */
  preferredDomainId?: string
  preferredStreetId?: string
}

export interface IServiceHistory {
  domainId?: string
  setDomainId: (domainId: string) => void
  address?: string
  setAddress: (address: string) => void
  addresses: IAddressOption[]
  period: MonthPeriod | null
  setPeriod: (period: MonthPeriod | null) => void
  /** The month services of the picked domain and address, of any period. */
  services: IService[]
  isFetching: boolean
  isError: boolean
}

/** Filters of a chart over the month services of one domain address. */
const useServiceHistory = ({
  domains,
  preferredDomainId,
  preferredStreetId,
}: IServiceHistoryOptions): IServiceHistory => {
  const [pickedDomainId, setDomainId] = useState(preferredDomainId)
  const [pickedAddress, setAddress] = useState(preferredStreetId)
  const [period, setPeriod] = useState<MonthPeriod | null>(null)

  useEffect(() => {
    if (preferredDomainId) setDomainId(preferredDomainId)
  }, [preferredDomainId])

  useEffect(() => {
    if (preferredStreetId) setAddress(preferredStreetId)
  }, [preferredStreetId])

  // Both filters are mandatory, so a missing or stale pick falls back to the
  // first option.
  const domainId = domains.some(({ value }) => value === pickedDomainId)
    ? pickedDomainId
    : domains[0]?.value

  const { currentData, isFetching, isError } = useGetAllServicesQuery(
    { domainId, limit: 0 },
    { skip: !domainId }
  )

  // The API sorts by date, newest first: so do the addresses.
  const addresses = useMemo(
    () => getAddressOptions(currentData?.data ?? []),
    [currentData]
  )
  const address = addresses.some(({ value }) => value === pickedAddress)
    ? pickedAddress
    : addresses[0]?.value

  const services = useMemo(
    () => filterByAddress(currentData?.data ?? [], address),
    [currentData, address]
  )

  return {
    domainId,
    setDomainId,
    address,
    setAddress,
    addresses,
    period,
    setPeriod,
    services,
    isFetching,
    isError,
  }
}

export default useServiceHistory
