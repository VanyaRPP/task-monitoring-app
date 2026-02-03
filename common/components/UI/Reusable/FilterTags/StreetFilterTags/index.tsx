import { IFilter } from '@common/api/paymentApi/payment.api.types'
import FilterTags from '@components/UI/Reusable/FilterTags'
import { Typography } from 'antd'
import { IServiceFilter } from '@common/api/serviceApi/service.api.types'

export const StreetFilterTags: React.FC<{
  collection: IFilter[]
  filters: IServiceFilter | undefined
  setFilters: (filters: IServiceFilter | undefined) => void
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
      onClose={(item) => {
        const currentStreet = Array.isArray(filters?.street)
          ? filters.street
          : []
        const newStreet = currentStreet.filter((f) => f !== item.value)
        setFilters({
          ...filters,
          street: newStreet.length > 0 ? (newStreet as any) : undefined,
        })
      }}
    />
  )
}
