import { Select } from 'antd'
import { IFilter } from '@common/api/paymentApi/payment.api.types'
import styles from './style.module.scss'

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
  const options = [...streets]
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((street) => ({
      label: street.text,
      value: String(street.value),
    }))

  return (
    <Select
      placeholder="Виберіть вулицю"
      value={filters?.street}
      onChange={(value) =>
        setFilters({
          ...filters,
          street: value,
        })
      }
      style={{
        minWidth: 250,
      }}
      allowClear
      className={className}
      popupMatchSelectWidth={false}
      dropdownClassName={styles.streetDropdown}
      options={options}
      {...props}
    />
  )
}

export default StreetsSelector
