import React from 'react'
import { SelectOutlined } from '@ant-design/icons'
import { Button, Select } from 'antd'
import { useRouter } from 'next/router'
import { AppRoutes } from '@utils/constants'

export interface Props {
  domainOptions?: { value: string; label: string }[]
  selectedDomain?: string
  onDomainChange?: (value: string) => void
}

const MyServicesHeader: React.FC<Props> = ({
  domainOptions = [],
  selectedDomain,
  onDomainChange,
}) => {
  const router = useRouter()

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Button
        type="link"
        onClick={() => router.push(AppRoutes.MYSERVICES)}
        icon={<SelectOutlined />}
      >
        Мої послуги
      </Button>

      {domainOptions.length > 0 && (
        <Select
          options={domainOptions}
          value={selectedDomain}
          onChange={onDomainChange}
          placeholder="Виберіть домен"
          style={{ width: 200 }}
          allowClear
        />
      )}
    </div>
  )
}

export default MyServicesHeader
