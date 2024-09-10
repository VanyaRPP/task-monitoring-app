import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IDomain } from '@modules/models/Domain'
import React, {useEffect, useMemo, useState} from 'react'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { isAdminCheck } from '@utils/helpers'
import { Select } from 'antd'
import s from './style.module.scss'

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