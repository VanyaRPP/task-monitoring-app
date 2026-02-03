import { IFilter } from '@common/api/paymentApi/payment.api.types'
import FilterTags from '@components/UI/Reusable/FilterTags'
import { Typography } from 'antd'
import { IServiceFilter } from '@common/api/serviceApi/service.api.types'

export const DomainFilterTags: React.FC<{
  collection: IFilter[]
  filters: IServiceFilter | undefined
  setFilters: (filters: IServiceFilter | undefined) => void
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
      onClose={(item) => {
        const currentDomain = Array.isArray(filters?.domain)
          ? filters.domain
          : []
        const newDomain = currentDomain.filter((f) => f !== item.value)
        setFilters({
          ...filters,
          domain: newDomain.length > 0 ? (newDomain as any) : undefined,
        })
      }}
    />
  )
}

