import { IFilter } from '@common/api/paymentApi/payment.api.types'
import FilterTags from '@components/UI/Reusable/FilterTags'
import { Typography } from 'antd'

export const StreetFilterTags: React.FC<{
  collection: IFilter[]
  filters: { street: string[] }
  setFilters: React.Dispatch<React.SetStateAction<{ street: string[] }>>
}> = ({ collection, filters, setFilters }) => {
  return (
    <FilterTags
      title={<Typography.Text>Адреси:</Typography.Text>}
      closable={collection?.length !== 1}
      // color="blue"
      items={
        collection?.length === 1
          ? [collection[0]]
          : collection?.filter((filter) =>
              filters?.street?.includes(filter.value)
            )
      }
      onClose={(item) =>
        setFilters({
          ...filters,
          street: filters?.street?.filter((filter) => filter !== item.value),
        })
      }
    />
  )
}
