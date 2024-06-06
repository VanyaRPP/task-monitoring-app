import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { SelectorProps } from '@common/components/UI/Selectors'
import { IDomain } from '@common/modules/models/Domain'
import { IStreet } from '@common/modules/models/Street'
import { Select } from 'antd'

export interface DomainAdminSelectProps extends SelectorProps {
  domain?: IDomain['_id']
  street?: IStreet['_id']
}

export const DomainAdminSelect: React.FC<DomainAdminSelectProps> = ({
  domain: domainId,
  street: streetId,
  ...props
}) => {
  const { data: domains, isLoading: isDomainsLoading } = useGetDomainsQuery({
    domainId,
    streetId,
  })

  return (
    <Select
      placeholder="Оберіть представника..."
      loading={isDomainsLoading}
      showSearch
      allowClear
      optionFilterProp="label"
      options={domains?.filter.adminEmails.map((filter) => ({
        label: filter.text,
        value: filter.value,
      }))}
      {...props}
    />
  )
}
