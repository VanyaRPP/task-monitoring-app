import { useGetStreetsQuery } from '@common/api/streetApi/street.api'
import { SelectorProps } from '@common/components/UI/Selectors'
import { IDomain } from '@common/modules/models/Domain'
import { Select } from 'antd'

export interface StreetSelectProps extends SelectorProps {
  domain?: IDomain['_id']
}

export const StreetSelect: React.FC<StreetSelectProps> = ({
  domain: domainId,
  ...props
}) => {
  const { data: streets, isLoading: isStreetsLoading } = useGetStreetsQuery({
    domainId,
  })

  return (
    <Select
      placeholder="Оберіть адресу..."
      loading={isStreetsLoading}
      showSearch
      allowClear
      optionFilterProp="label"
      options={streets?.data.map((street) => ({
        label: `вул. ${street.address} (м. ${street.city})`,
        value: street._id,
      }))}
      {...props}
    />
  )
}
