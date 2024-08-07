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
      month: lastMonth.month(),
      year: lastMonth.year(),
      domainId,
      streetId,
    },
    { skip: !domainId || !streetId || !date }
  )
  return { previousMonth: data?.data?.[0] }
}
