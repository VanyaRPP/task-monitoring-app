import { useGetRealEstatesQuery } from '@common/api/realestateApi/realestate.api'
import { SelectorProps } from '@common/components/UI/Selectors'
import { IDomain } from '@common/modules/models/Domain'
import { IStreet } from '@common/modules/models/Street'
import { Select } from 'antd'

export interface CompanyAdminSelectProps extends SelectorProps {
  domain?: IDomain['_id']
  street?: IStreet['_id']
}

export const CompanyAdminSelect: React.FC<CompanyAdminSelectProps> = ({
  domain: domainId,
  street: streetId,
  ...props
}) => {
  const { data: companies, isLoading: isCompaniesLoading } =
    useGetRealEstatesQuery({
      domainId,
      streetId,
    })

  return (
    <Select
      placeholder="Оберіть представника..."
      loading={isCompaniesLoading}
      showSearch
      allowClear
      optionFilterProp="label"
      options={companies?.filter.adminEmails.map((filter) => ({
        label: filter.text,
        value: filter.value,
      }))}
      {...props}
    />
  )
}
