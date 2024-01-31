import { Tag } from 'antd'
import s from './style.module.scss'

const AddressesFilterTags = ({ filter, setFilters, collection }) => {
  return (
    <>
        <div className={s.filtersTagsBlock}>
            <div className={s.filters}>
                Адреси:
                {filter?.street?.length ? (
                    <span className={s.filtersTags}>
              {filter.street.map((street) => (
                  <Tag
                      key={street}
                      className={s.Tag}
                      closable
                      onClose={() =>
                          setFilters({
                              ...filter,
                              street: filter.street.filter((item) => item !== street),
                          })
                      }
                  >
                      {
                          collection?.addressFilter?.find(
                              (item) => item.value === street
                          )?.text
                      }
                  </Tag>
              ))}
            </span>
                ) : (
                    ' Всі'
                )}
            </div>
            <div className={s.filters}>
                Домени:
                {filter?.domain?.length ? (
                    <span className={s.filtersTags}>
                {filter.domain.map((domain) => (
                    <Tag
                        key={domain}
                        className={s.Tag}
                        closable
                        onClose={() =>
                            setFilters({
                                ...filter,
                                domain: filter.domain.filter((item) => item !== domain),
                            })
                        }
                    >
                        {
                            collection?.domainFilter?.find(
                                (item) => item.value === domain
                            )?.text
                        }
                    </Tag>
                ))}
                </span>
                ) : (
                    ' Всі'
                )}
            </div>
        </div>
    </>
  )
}

export default AddressesFilterTags
