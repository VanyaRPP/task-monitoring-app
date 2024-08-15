import { IFilter } from '@common/api/paymentApi/payment.api.types'
import { Tags, TagsProps } from '@components/UI/Tags'
import { Tag, Typography } from 'antd'
import s from '../style.module.scss'

/**
 * @deprecated use universal `FilterTags` instead
 */
const _FilterTags = ({ filters, setFilters, collection }) => {
  return (
    <>
      <div className={s.filtersTagsBlock}>
        <div className={s.filters}>
          <Typography.Text>Надавачі послуг:</Typography.Text>
          {Array.isArray(filters?.domain) && filters.domain.length ? (
            <span className={s.filtersTags}>
              {filters.domain.map((domain) => (
                <Tag
                  key={domain}
                  className={s.Tag}
                  closable
                  onClose={() =>
                    setFilters({
                      ...filters,
                      domain: filters.domain.filter((item) => item !== domain),
                    })
                  }
                >
                  {
                    collection?.domainsFilter?.find(
                      (item) => item.value === domain
                    )?.text
                  }
                </Tag>
              ))}
            </span>
          ) : collection?.currentDomainsCount &&
            collection?.domainsFilter?.length === 1 ? (
            <SingleTag name={collection?.data?.[0]?.domain?.name} />
          ) : (
            <Typography.Text className={s.allTag}>Всі</Typography.Text>
          )}
        </div>
        <div className={s.filters}>
          <Typography.Text>Компанії:</Typography.Text>
          {Array.isArray(filters?.company) && filters.company.length ? (
            <div className={s.filtersTags}>
              {filters.company.map((company) => (
                <Tag
                  key={company}
                  className={s.Tag}
                  closable
                  onClose={() =>
                    setFilters({
                      ...filters,
                      company: filters.company.filter(
                        (item) => item !== company
                      ),
                    })
                  }
                >
                  {
                    collection?.realEstatesFilter?.find(
                      (item) => item.value === company
                    )?.text
                  }
                </Tag>
              ))}
            </div>
          ) : (collection?.currentCompaniesCount ||
              collection?.realEstatesFilter?.length) === 1 ? (
            <SingleTag
              name={
                collection?.data?.[0]?.company?.companyName ||
                collection?.data?.[0]?.companyName
              }
            />
          ) : (
            <Typography.Text className={s.allTag}>Всі</Typography.Text>
          )}
        </div>
      </div>
    </>
  )
}

function SingleTag({ name }) {
  return name ? <Tag className={s.Tag}>{name}</Tag> : null
}

export default _FilterTags

export const FilterTags: React.FC<{
  title?: React.ReactNode
  items?: IFilter[]
  closable?: boolean
  onClose?: (item: IFilter, index: number, items: IFilter[]) => void
  color?: TagsProps['color']
}> = ({ title, items, closable = true, onClose, color }) => (
  <Tags
    items={items}
    title={title}
    size={1}
    wrap
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

export { CompanyFilterTags } from './CompanyFilterTags'
export { DomainFilterTags } from './DomainFilterTags'
export { StreetFilterTags } from './StreetFilterTags'
