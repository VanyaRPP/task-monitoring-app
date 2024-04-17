import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import moment from 'moment'

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
  // TODO: getPreviousMonth from utils
  const lastMonth = moment(date).subtract(1, 'month')
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
