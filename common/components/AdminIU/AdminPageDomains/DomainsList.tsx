import React, { useState } from 'react'
import { Empty, List } from 'antd'
import s from './style.module.scss'
import { IDomain } from '@common/modules/models/Domain'
// import DomainCard from 'common/components/DomainCard/index'
// import { useGetDomainByIdQuery } from '../../../api/domainApi/domain.api'

interface Props {
  domains: IDomain[]
}

const DomainsList: React.FC<Props> = ({ domains }) => {
  const [domain, setDomain] = useState(domains[0])

  if (!domains || domains.length === 0)
    return <Empty description="Немає даних" />

  return (
    <div className={s.Container}>
      <List
        className={s.List}
        dataSource={domains}
        renderItem={(item, index) => (
          <List.Item
            key={index}
            // key={item._id}
            onClick={() => setDomain(item)}
            className={`${s.ListItem} ${
              domain._id === item._id ? s.Active : ''
            }`}
          >
            {item.name}
          </List.Item>
        )}
      />

      {/* <DomainCard domainId={domain._id} domain={domain} /> */}
    </div>
  )
}
export default DomainsList
