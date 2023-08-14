import { useEffect, useState } from 'react'

import { Select } from 'antd'
import { DefaultOptionType } from 'antd/lib/select'
import classNames from 'classnames'
import moment from 'moment'

import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { NumberToFormattedMonth } from '@utils/helpers'

import s from './style.module.scss'

export interface Props {
  userId?: string
  domainId?: string
  streetId?: string
  onSelect?: (value) => void
  className?: string
  style?: React.CSSProperties
  showSearch?: boolean
  allowClear?: boolean
}

export const ServiceSelect: React.FC<Props> = ({
  userId,
  domainId,
  streetId,
  onSelect,
  className,
  style,
  showSearch = true,
  allowClear = true,
}) => {
  const [select, setSelect] = useState<number>(null)

  const { data, isFetching } = useGetAllServicesQuery({
    userId,
    domainId,
    streetId,
  })

  // restore
  useEffect(() => {
    setSelect(null)
  }, [domainId, data])

  // predefine
  useEffect(() => {
    if (data?.length === 1) setSelect(data[0].date.getMonth())
  }, [data, setSelect])

  const options: DefaultOptionType[] = data?.map((item) => ({
    value: item._id,
    // TODO: proper label
    label: item.description,
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
      placeholder={'Послуга'}
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

export const ServiceMonthSelect: React.FC<Props> = ({
  userId,
  domainId,
  streetId,
  onSelect,
  className,
  style,
  showSearch = true,
  allowClear = true,
}) => {
  const [select, setSelect] = useState<number>(null)

  const { data, isFetching } = useGetAllServicesQuery({
    userId,
    domainId,
    streetId,
  })

  const months: number[] = data?.map((item) => moment(item.date).month())

  // restore
  useEffect(() => {
    setSelect(null)
  }, [domainId, data])

  // predefine
  useEffect(() => {
    if (months?.length === 1) setSelect(months[0])
  }, [months, setSelect])

  const options: DefaultOptionType[] = months?.map((num) => ({
    value: num,
    label: NumberToFormattedMonth(num),
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
      placeholder={'Місяць'}
      allowClear={allowClear}
      showSearch={showSearch}
      style={style}
      className={classNames(className, s.Select)}
      options={options}
      value={select}
      onSelect={handleSelect}
      onClear={handleCrear}
      disabled={!months || months?.length <= 1 || isFetching}
    />
  )
}
