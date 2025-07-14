import { Select } from 'antd'

const StreetsSelector = ({ setFilters, streets, className, ...props }) => {
  const options = streets?.map((street) => ({
    label: street.text,
    value: street.value,
  }))

  return (
    <Select
      className={className}
      placeholder="Виберіть вулицю"
      // style={{ width: '200px' }}
      onChange={(value) => {
        setFilters((prevFilters) => ({
          ...prevFilters,
          street: value,
        }))
      }}
      allowClear
      options={options}
      {...props}
    />
  )
}

export default StreetsSelector
