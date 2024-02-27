import { Tag } from 'antd'
import s from '../style.module.scss'

const FilterTags = ({ filters, setFilters, collection }) => {
  return (
    <>
      <div className={s.filtersTagsBlock}>
        <div className={s.filters}>
          Надавачі послуг:
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
          ) : (collection?.currentDomainsCount ||
              Array.isArray(collection?.domainsFilter)) === 1 ? (
            <SingleTag name={collection?.data?.[0]?.domain?.name} />
          ) : (
            ' Всі'
          )}
        </div>
        <div className={s.filters}>
          Компанії:
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
            ' Всі'
          )}
        </div>
      </div>
    </>
  )
}

function SingleTag({ name }) {
  return name ? <Tag className={s.Tag}>{name}</Tag> : null
}

export default FilterTags
