import { Select } from 'antd'
import s from '@components/StreetsSelector/style.module.scss'

const StreetsSelector = ({ setFilters, streets }) => {
  const options = streets?.map((street) => {
    return {
      label: street.text,
      value: street.value,
    }
  })

  return (
    <Select
      placeholder="Виберіть вулицю"
      style={{ width: '250px' }}
      onChange={(value) => {
        setFilters({ street: value })
      }}
      allowClear
      options={options}
    ></Select>
  )
}

export default StreetsSelector
