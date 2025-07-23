import { Select } from 'antd'
import { IFilter } from '@common/api/paymentApi/payment.api.types'

interface StreetsSelectorProps {
  streets: IFilter[]
  filters?: Record<string, any>
  setFilters: (f: Record<string, any>) => void
  className?: string
  [key: string]: any 
}

const StreetsSelector: React.FC<StreetsSelectorProps> = ({
  streets,
  filters = {},
  setFilters,
  className,
  ...props
}) => {
  const options = streets.map((street) => ({
    label: street.text,
    value: street.value,
  }))

  return (
    <Select
      placeholder="Виберіть вулицю"
      // style={{ width: 200 }}
      value={filters?.street}
      onChange={(value) =>
        setFilters((prev) => ({
          ...prev,
          street: value,
        }))
      }
      allowClear
      className={className}
      options={options}
      {...props}
    />
  )
}

export default StreetsSelector
