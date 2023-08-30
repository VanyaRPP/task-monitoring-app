import { Tag } from 'antd'
import s from '../style.module.scss'

const PaymentsFilterTags = ({ filters, setFilters, payments }) => {
  return (
    <>
      <div className={s.filtersTagsBlock}>
        <div className={s.filters}>
          Домени:
          {filters?.domain?.length ? (
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
                    payments?.domainsFilter?.find(
                      (item) => item.value === domain
                    )?.text
                  }
                </Tag>
              ))}
            </span>
          ) : payments?.currentDomainsCount === 1 ? (
            <SingleTag name={payments?.data?.[0]?.domain?.name} />
          ) : (
            ' Всі'
          )}
        </div>
        <div className={s.filters}>
          Компанії:
          {filters?.company?.length ? (
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
                    payments?.realEstatesFilter?.find(
                      (item) => item.value === company
                    )?.text
                  }
                </Tag>
              ))}
            </div>
          ) : payments?.currentCompaniesCount === 1 ? (
            <SingleTag name={payments?.data?.[0]?.company?.companyName} />
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

export default PaymentsFilterTags
