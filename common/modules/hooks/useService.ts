import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'

interface IUseServiceProps {
  serviceId?: string
  skip?: boolean
}

function useService({ serviceId, skip }: IUseServiceProps) {
  const { data: services, isLoading } = useGetAllServicesQuery(
    { serviceId },
    { skip }
  )
  const service = services ? services[0] : null

  return { service , isLoading }
}

export default useService
