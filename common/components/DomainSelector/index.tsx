import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IDomain } from '@modules/models/Domain'
import { Select } from 'antd'
import React, {useEffect, useMemo, useState} from 'react'

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

  const [currentValue, setCurrentValue] = useState(options.length ? options[0].value : undefined)


  useEffect(() => {
    if (!options.length)
      return
    setCurrentValue(options[0].value)
  }, [options.length]);

  return (
    <Select
      allowClear
      showSearch
      optionFilterProp="label"
      options={options}
      value={currentValue}
      onSelect={(value) => {
        setCurrentValue(value)
        return onSelect?.(value)
      }}
      style={{ width: '100%' }}
      placeholder="Оберіть домен"
      defaultActiveFirstOption={true}
    />
  )
}

export default DomainSelector