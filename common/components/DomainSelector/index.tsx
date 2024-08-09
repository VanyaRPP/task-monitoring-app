import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IDomain } from '@modules/models/Domain'
import { Select } from 'antd'
import React, { useMemo } from 'react'

const DomainSelector: React.FC<{
  onSelect?: (domainId: IDomain['_id']) => void
}> = ({ onSelect }) => {
  // TODO: replace with isolated domains filter api later
  const { data: { domainsFilter } = { domainsFilter: [] } } =
    useGetAllRealEstateQuery({})

  const options = useMemo(() => {
    return domainsFilter.map(({ value, text }) => ({
      value,
      label: text,
    }))
  }, [domainsFilter])

  return (
    <Select
      allowClear
      showSearch
      optionFilterProp="label"
      options={options}
      value={options.length ? options[0].value : undefined}
      onSelect={(value) => onSelect?.(value)}
      style={{ width: '100%' }}
      placeholder="Оберіть домен"
      defaultActiveFirstOption={true}
    />
  )
}

export default DomainSelector