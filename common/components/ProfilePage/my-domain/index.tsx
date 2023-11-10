import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { Radio, Card } from 'antd'
import React from 'react'

const MyDomain: React.FC = () => {
  const { data: domains = [], isLoading } = useGetDomainsQuery({})

  return (
    <Card loading={isLoading} size="small" title="Мої орендодавеці">
      <Radio.Group>
        {domains.map((item) => (
          <Radio.Button value={item.name} key={item.name}>
            {item.name}
          </Radio.Button>
        ))}
      </Radio.Group>
    </Card>
  )
}

export default MyDomain
