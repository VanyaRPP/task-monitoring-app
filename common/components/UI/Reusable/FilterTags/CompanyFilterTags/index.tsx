import { IFilter } from '@common/api/paymentApi/payment.api.types'
import { FilterTags } from '@components/UI/Reusable/FilterTags'
import { Typography } from 'antd'

export const CompanyFilterTags: React.FC<{
  collection: IFilter[]
  filters: { company: string[] }
  setFilters: React.Dispatch<React.SetStateAction<{ company: string[] }>>
}> = ({ collection, filters, setFilters }) => {
  return (
    <FilterTags
      title={<Typography.Text>Компанії:</Typography.Text>}
      closable={collection?.length !== 1}
      color="blue"
      items={
        collection?.length === 1
          ? [collection[0]]
          : collection?.filter((filter) =>
              filters?.company?.includes(filter.value)
            )
      }
      onClose={(item) =>
        setFilters({
          ...filters,
          company: filters?.company?.filter((filter) => filter !== item.value),
        })
      }
    />
  )
}
