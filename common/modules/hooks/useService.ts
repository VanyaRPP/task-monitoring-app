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
  const service = services?.data ? services?.data[0] : null

  return { service, isLoading }
}

export default useService

export function usePreviousMonthService({ domainId, streetId, date }) {
  const lastMonth = moment(date).subtract(1, 'month')
  const { data } = useGetAllServicesQuery(
    {
      month: lastMonth.month() + 1,
      year: lastMonth.year(),
      domainId,
      streetId,
    },
    { skip: !domainId || !streetId || !date }
  )
  console.log('penis', data)
  return { previousMonth: data?.[0] }
}
