import { useGetServicesQuery } from '@common/api/serviceApi/service.api'
import moment from 'moment'

interface IUseServiceProps {
  serviceId?: string
  skip?: boolean
}

function useService({ serviceId, skip }: IUseServiceProps) {
  const { data: services, isLoading } = useGetServicesQuery(
    { serviceId },
    { skip: !serviceId || skip }
  )

  const service = !!services && !!services.data ? services.data[0] : null

  return { service, isLoading }
}

export default useService

export function usePreviousMonthService({ domainId, streetId, date }) {
  const lastMonth = moment(date).subtract(1, 'month')
  const { data } = useGetServicesQuery(
    {
      month: lastMonth.month() + 1,
      year: lastMonth.year(),
      domainId,
      streetId,
    },
    { skip: !domainId || !streetId || !date }
  )
  return { previousMonth: data?.data?.[0] }
}
