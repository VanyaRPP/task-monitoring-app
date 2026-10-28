import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import dayjs from 'dayjs'

interface IUseServiceProps {
  serviceId?: string
  skip?: boolean
}

function useService({ serviceId, skip }: IUseServiceProps) {
  const { data: services, isLoading } = useGetAllServicesQuery(
    { serviceId },
    { skip: !serviceId || skip }
  )

  const service = !!services && !!services.data ? services.data[0] : null

  return { service, isLoading }
}

export default useService

export function usePreviousMonthService({ domainId, streetId, date }) {
  const lastMonth = dayjs(date).subtract(1, 'month')
  const { data } = useGetAllServicesQuery(
    {
      // The API filters on Mongo's $month (1-12); dayjs months are 0-based,
      // so `.month()` alone asked for the month before last.
      month: lastMonth.month() + 1,
      year: lastMonth.year(),
      domainId,
      streetId: streetId || undefined,
      withoutStreet: streetId ? undefined : true,
    },
    { skip: !domainId || !date }
  )
  return { previousMonth: data?.data?.[0] }
}
