import { Select } from 'antd'
import { IFilter } from '@common/api/paymentApi/payment.api.types'

interface StreetsSelectorProps {
  streets: IFilter[]
  filters?: Record<string, any>
  setFilters: (f: Record<string, any>) => void
}

const StreetsSelector: React.FC<StreetsSelectorProps> = ({
  streets,
  filters = {},
  setFilters,
}) => {
  const options = streets.map((streets) => ({
    label: streets.text,
    value: streets.value,
  }))

  return (
    <Select
      placeholder="Виберіть вулицю"
      style={{ width: 200 }}
      value={filters?.street}
      onChange={(value) =>
        setFilters({
          ...filters,
          street: value,
        })
      }
      allowClear
      options={options}
    />
  )
}

export default StreetsSelector
