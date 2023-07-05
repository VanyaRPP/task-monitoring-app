import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'

function useService({ serviceId, domainId, streetId }) {
  // TODO: fix
  // something with streetId
  const strtId = streetId?._id || streetId
  const { data: services, isLoading } = useGetAllServicesQuery({
    domainId,
    streetId: strtId,
  })
  const service = services?.find((i) => i._id === serviceId)
  return { service, isLoading }
}

export default useService
