import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { SelectorProps } from '@common/components/UI/Selectors'
import { IStreet } from '@common/modules/models/Street'
import { Select } from 'antd'

export interface DomainSelectProps extends SelectorProps {
  street?: IStreet['_id']
}

export const DomainSelect: React.FC<DomainSelectProps> = ({
  street: streetId,
  ...props
}) => {
  const { data: domains, isLoading: isDomainsLoading } = useGetDomainsQuery({
    streetId,
  })

  return (
    <Select
      placeholder="Оберіть надавача послуг..."
      loading={isDomainsLoading}
      showSearch
      allowClear
      optionFilterProp="label"
      options={domains?.data.map(({ _id, name }) => ({
        label: name,
        value: _id,
      }))}
      {...props}
    />
  )
}
