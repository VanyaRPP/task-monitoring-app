import { IFilter } from '@common/api/paymentApi/payment.api.types'
import { Tags, TagsProps } from '@components/UI/Tags'
import { Tag, Typography } from 'antd'

const FilterTags: React.FC<{
  title?: React.ReactNode
  items?: IFilter[]
  closable?: boolean
  onClose?: (item: IFilter, index: number, items: IFilter[]) => void
  color?: TagsProps['color']
}> = ({ title, items, closable = true, onClose, color }) => {
  return (
    <Tags
      items={items}
      title={title}
      size={1}
      wrap
      placeholder={<Typography.Text>Всі</Typography.Text>}
      render={(item, index, _items) => (
        <Tag
          key={item.value}
          closable={closable}
          onClose={(e) => {
            e.preventDefault()
            onClose?.(item, index, _items)
          }}
          color={color}
          bordered={false}
          style={{ margin: 0, fontWeight: 'normal' }}
        >
          {item.text}
        </Tag>
      )}
    />
  )
}

export { CompanyFilterTags } from './CompanyFilterTags'
export { DomainFilterTags } from './DomainFilterTags'
export { StreetFilterTags } from './StreetFilterTags'

export default FilterTags
