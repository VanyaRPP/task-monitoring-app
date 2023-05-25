import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'

function useService({ serviceId, domainId, streetId }) {
  const { data: services, isLoading } = useGetAllServicesQuery({
    domainId,
    streetId,
  })
  const service = services?.find((i) => i._id === serviceId)
  return { service, isLoading }
}

export default useService
