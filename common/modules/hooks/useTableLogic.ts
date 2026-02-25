import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { message } from 'antd'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { 
  useGetRealEstateFiltersQuery, 
  useGetDomainFiltersQuery, 
  useGetAddressFiltersQuery 
} from '@common/api/filterApi/filter.api'
import { useGetDebtorsQuery } from '@common/api/debtorsApi/debtors.api'
import { 
  useDeleteRealEstateMutation, 
  useUpdateArchivedItemMutation 
} from '@common/api/realestateApi/realestate.api'
import { isAdminCheck } from '@utils/helpers'
import { Roles } from '@utils/constants'
import { SERVICE_COLUMNS_CONFIG } from 'common/components/Tables/Companies/Table.columns'
import { Props } from '@components/Tables/Companies/Table'

export const useTableLogic = (props: Props) => {
  const { realEstates, filters, customServices, isArchive } = props
  const router = useRouter()
  const { pathname } = router

  const { data: userResponse } = useGetCurrentUserQuery()

  const { data: realEstateData } = useGetRealEstateFiltersQuery({
    streets: filters?.street,
    domains: filters?.domain,
    archived: isArchive,
  })
  const { data: domainData } = useGetDomainFiltersQuery({
    streets: filters?.street,
    realEstates: filters?.company,
  })
  const { data: streetData } = useGetAddressFiltersQuery({
    realEstates: filters?.company,
    domains: filters?.domain,
  })

  const [domainIds, setDomainIds] = useState([])
  useEffect(() => {
    if (domainData?.domainsFilter) {
      setDomainIds(domainData?.domainsFilter.map((d: any) => d.value))
    }
  }, [domainData])

  const { data: debtorsData } = useGetDebtorsQuery(
    { domainIds },
    { skip: !domainIds || domainIds.length === 0 }
  )

  const [deleteRealEstate, { isLoading: deleteLoading }] = useDeleteRealEstateMutation()
  const [updateArchivedItem, { isLoading: archiveLoading }] = useUpdateArchivedItemMutation()

  const handleDelete = async (id: string) => {
    const response = await deleteRealEstate(id)
    if ('data' in response) message.success('Видалено!')
    else message.error('Помилка при видаленні')
  }

  const handleArchive = async (id: string, archived: boolean) => {
    const response = await updateArchivedItem({ _id: id, archived })
    if ('data' in response) {
      message.success(archived ? 'Компанію архівовано' : 'Компанію розархівовано')
    } else {
      message.error('Помилка при зміні статусу')
    }
  }

  const dataSource = useMemo(() => {
    const rawData = realEstates?.data || []
    return [...rawData].sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''))
  }, [realEstates?.data])

  const activeServiceKeys = useMemo(() => {
    if (filters?.services?.length > 0) {
      return filters.services
    }

    const keys = new Set<string>()
    if (dataSource.length === 0) {
      return Object.keys(SERVICE_COLUMNS_CONFIG)
    }

    dataSource.forEach((record: any) => {
      Object.keys(SERVICE_COLUMNS_CONFIG).forEach((key) => {
        const value = record[key]
        const config = SERVICE_COLUMNS_CONFIG[key]
        if (config.isCheckbox ? value === true : value > 0) {
          keys.add(key)
        }
      })
      const allNested = [
        ...(record.services || []),
        ...(record.customServices || []),
        ...((record as any).individualServices || []),
      ]
      allNested.forEach((s) => {
        const id = s._id || s.serviceId
        if (id) keys.add(String(id))
      })
    })

    return keys.size > 0 ? Array.from(keys) : Object.keys(SERVICE_COLUMNS_CONFIG)
  }, [dataSource, filters?.services])

  const isGlobalAdmin = userResponse?.roles?.includes(Roles.GLOBAL_ADMIN)
  const isUser = userResponse?.roles?.includes(Roles.USER)
  const isAdmin = isAdminCheck(userResponse?.roles)

  const isSingleCompanyByData = useMemo(() => {
    if (!realEstates?.data?.length) return false
    return new Set(realEstates.data.map((item: any) => item.companyName)).size === 1
  }, [realEstates?.data])

  return {
    pathname,
    isAdmin,
    isUser,
    isGlobalAdmin,
    dataSource,
    keysToRender: activeServiceKeys,
    debtorCompanies: debtorsData?.companies,
    isSingleCompanyByData,
    filtersData: {
      realEstate: realEstateData,
      domain: domainData,
      street: streetData,
    },
    handlers: {
      handleDelete,
      handleArchive,
      deleteLoading,
      archiveLoading,
    }
  }
}