import { IFilter } from '@common/api/paymentApi/payment.api.types'
import { FilterTags } from '@components/UI/Reusable/FilterTags'
import { Typography } from 'antd'

export const DomainFilterTags: React.FC<{
  collection: IFilter[]
  filters: { domain: string[] }
  setFilters: React.Dispatch<React.SetStateAction<{ domain: string[] }>>
}> = ({ collection, filters, setFilters }) => {
  return (
    <FilterTags
      title={<Typography.Text>Надавачі послуг:</Typography.Text>}
      closable={collection?.length !== 1}
      color="purple"
      items={
        collection?.length === 1
          ? [collection[0]]
          : collection?.filter((filter) =>
              filters?.domain?.includes(filter.value)
            )
      }
      onClose={(item) =>
        setFilters({
          ...filters,
          domain: filters?.domain?.filter((filter) => filter !== item.value),
        })
      }
    />
  )
}
