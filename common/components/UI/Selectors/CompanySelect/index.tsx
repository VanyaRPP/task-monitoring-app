import { useGetRealEstatesQuery } from '@common/api/realestateApi/realestate.api'
import { SelectorProps } from '@common/components/UI/Selectors'
import { IDomain } from '@common/modules/models/Domain'
import { IStreet } from '@common/modules/models/Street'
import { Select } from 'antd'

export interface CompanySelectProps extends SelectorProps {
  domain?: IDomain['_id']
  street?: IStreet['_id']
}

export const CompanySelect: React.FC<CompanySelectProps> = ({
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
      placeholder="Оберіть компанію..."
      loading={isCompaniesLoading}
      showSearch
      allowClear
      optionFilterProp="label"
      options={companies?.data.map((company) => ({
        label: company.companyName,
        value: company._id,
      }))}
      {...props}
    />
  )
}
