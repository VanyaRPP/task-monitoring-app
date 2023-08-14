import { useEffect, useState } from 'react'

import { Select } from 'antd'
import { DefaultOptionType } from 'antd/lib/select'
import classNames from 'classnames'

import { useGetAllStreetsQuery } from '@common/api/streetApi/street.api'

import s from './style.module.scss'

export interface Props {
  domainId?: string
  onSelect?: (value) => void
  className?: string
  style?: React.CSSProperties
  showSearch?: boolean
  allowClear?: boolean
}

export const StreetSelect: React.FC<Props> = ({
  domainId,
  onSelect,
  className,
  style,
  showSearch = true,
  allowClear = true,
}) => {
  const [select, setSelect] = useState<string>(null)

  const { data, isFetching } = useGetAllStreetsQuery({ domainId })

  // restore
  useEffect(() => {
    setSelect(null)
  }, [domainId, data])

  // predefine
  useEffect(() => {
    if (data?.length === 1) setSelect(data[0]._id)
  }, [data, setSelect])

  const options: DefaultOptionType[] = data?.map((item) => ({
    value: item._id,
    label: item.address + 'м. ' + item.city,
  }))

  const handleSelect = (value) => {
    setSelect(value)
    onSelect(value)
  }

  const handleCrear = () => {
    setSelect(null)
    onSelect(null)
  }

  return (
    <Select
      placeholder={'Вулиця'}
      allowClear={allowClear}
      showSearch={showSearch}
      style={style}
      className={classNames(className, s.Select)}
      options={options}
      value={select}
      onSelect={handleSelect}
      onClear={handleCrear}
      disabled={!data || data?.length <= 1 || isFetching}
    />
  )
}
