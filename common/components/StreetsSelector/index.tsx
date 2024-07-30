import React from 'react'
import { Select } from 'antd'

import s from '@components/StreetsSelector/style.module.scss'

const StreetsSelector = ({ filters, setFilters, streets }) => {
  const options = streets?.map((street) => {
    return {
      label: street.text,
      value: street.value,
    }
  })

  return (
    <div className={s.streetDiv}>
      <Select
        className={s.streetSelector}
        placeholder="Виберіть вулицю"
        onChange={(value) => {
          setFilters({ street: value })
        }}
        allowClear
        options={options}
      ></Select>
    </div>
  )
}

export default StreetsSelector
