'use client'

import { useMemo, useState } from 'react'
import type React from 'react'
import { Button, Card, Flex, Transfer, Typography } from 'antd'
import type { TransferDirection } from 'antd/es/transfer'

type CustomServiceRow = { _id: string; name: string }
type TransferItem = { key: string; title: string }

type Props = {
  services?: CustomServiceRow[]
  onDeleteGroup?: () => void
  groupTitle?: string
}

export const CustomServicesTable: React.FC<Props> = ({
  services = [],
  onDeleteGroup,
  groupTitle = 'Розміщення у просторі для роботи',
}) => {
  const dataSource: TransferItem[] = useMemo(
    () => services.map((x) => ({ key: x._id, title: x.name })),
    [services]
  )

  const [targetKeys, setTargetKeys] = useState<React.Key[]>([])
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])

  return (
    <Card
      styles={{
        body: { padding: 14 },
        header: { padding: '10px 14px', minHeight: 'auto' },
      }}
      title={
        <Flex align="center" justify="space-between" gap={12}>
          <Typography.Text strong>Група: {groupTitle}</Typography.Text>

          <Button type="link" danger style={{ padding: 0 }} onClick={onDeleteGroup}>
            Видалити групу послуг
          </Button>
        </Flex>
      }
    >
      <Transfer
        style={{ width: '100%' }}
        dataSource={dataSource}
        titles={['Доступні послуги', 'Обрані послуги']}
        targetKeys={targetKeys}
        selectedKeys={selectedKeys}
        onChange={(nextTargetKeys: React.Key[], _direction: TransferDirection) =>
          setTargetKeys(nextTargetKeys)
        }
        onSelectChange={(sourceSelectedKeys: React.Key[], targetSelectedKeys: React.Key[]) =>
          setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys])
        }
        render={(item) => item.title}
        showSearch={false}
        listStyle={{
          width: '100%',
          height: 340,
        }}
        locale={{ itemUnit: 'послуга', itemsUnit: 'послуг' }}
      />
    </Card>
  )
}