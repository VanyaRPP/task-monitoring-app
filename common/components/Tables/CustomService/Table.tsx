'use client'

import { useMemo, useState } from 'react'
import type React from 'react'
import { Transfer } from 'antd'
import type { TransferDirection } from 'antd/es/transfer'

type CustomServiceRow = { _id: string; name: string }
type TransferItem = { key: string; title: string }

type Props = {
  services?: CustomServiceRow[]
}

export const CustomServicesTable: React.FC<Props> = ({ services = [] }) => {
  const dataSource: TransferItem[] = useMemo(
    () => services.map((x) => ({ key: x._id, title: x.name })),
    [services]
  )

  const [targetKeys, setTargetKeys] = useState<React.Key[]>([])
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])

  return (
    <Transfer
      style={{ width: '100%' }}
      dataSource={dataSource}
      titles={['Доступні послуги', 'Обрані послуги']}
      targetKeys={targetKeys}
      selectedKeys={selectedKeys}
      onChange={(nextTargetKeys: React.Key[], _direction: TransferDirection) =>
        setTargetKeys(nextTargetKeys)
      }
      onSelectChange={(
        sourceSelectedKeys: React.Key[],
        targetSelectedKeys: React.Key[]
      ) => setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys])}
      render={(item) => item.title}
      showSearch={false}
      listStyle={{
        width: '100%',
        height: 340,
      }}
      locale={{ itemUnit: 'послуга', itemsUnit: 'послуг' }}
    />
  )
}
