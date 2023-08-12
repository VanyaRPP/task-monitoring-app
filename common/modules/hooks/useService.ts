import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'

interface IUseServiceProps {
  serviceId?: string
  domainId?: string
  streetId?: any
  skip?: boolean
}

function useService({ serviceId, domainId, streetId, skip }: IUseServiceProps) {
  // TODO: fix
  // something with streetId
  // TODO: set new function and fetch by specific single param, by serviceId
  const strtId = streetId?._id || streetId
  const { data: services, isLoading } = useGetAllServicesQuery(
    {
      domainId,
      streetId: strtId,
    },
    { skip }
  )
  const service = services?.find((i) => i._id === serviceId)
  return { service, isLoading }
}

export default useService
