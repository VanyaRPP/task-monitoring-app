import { useGetServicesQuery } from '@common/api/serviceApi/service.api'
import { dateToDefaultFormat } from '@common/assets/features/formatDate'
import { SelectorProps } from '@common/components/UI/Selectors'
import { IDomain } from '@common/modules/models/Domain'
import { IStreet } from '@common/modules/models/Street'
import { Select } from 'antd'

export interface ServiceSelectProps extends SelectorProps {
  domain?: IDomain['_id']
  street?: IStreet['_id']
  // company?: IRealEstate['_id']
}

export const ServiceSelect: React.FC<ServiceSelectProps> = ({
  domain: domainId,
  street: streetId,
  // company: companyId,
  ...props
}) => {
  const { data: services, isLoading: isServicesLoading } = useGetServicesQuery({
    domainId,
    streetId,
    // companyId,
  })

  return (
    <Select
      placeholder="Оберіть послугу..."
      loading={isServicesLoading}
      showSearch
      allowClear
      optionFilterProp="label"
      options={services?.data.map((service) => ({
        label: dateToDefaultFormat(service.date.toString()),
        value: service._id,
      }))}
      {...props}
    />
  )
}
