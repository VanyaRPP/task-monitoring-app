import { LeftOutlined } from '@ant-design/icons'
import { Button, Flex, FlexProps, Tag, Tooltip } from 'antd'
import { useCallback, useMemo, useState } from 'react'

export interface TagsProps<T = unknown>
  extends Omit<FlexProps, 'children' | 'title'> {
  items?: T[]
  size?: number
  render?: (item: T, index: number, items: T[]) => React.ReactNode
  title?: React.ReactNode
}

export const Tags = <T,>({
  items: _items = [],
  size = 5,
  render = (item, index, items) => (
    <Tag key={index} bordered={false} color="blue" style={{ margin: 0 }}>
      {item as any}
    </Tag>
  ),
  title,
  ...rest
}: TagsProps<T>) => {
  const [collapsed, setCollapsed] = useState<boolean>(true)

  const items = useMemo(() => {
    return collapsed ? _items.slice(0, size) : _items
  }, [_items, size, collapsed])

  const handleClick = useCallback(() => {
    setCollapsed(!collapsed)
  }, [collapsed, setCollapsed])

  return (
    <Flex gap={8} {...rest}>
      {title}

      {items.map((item, index) => render(item, index, items))}

      {_items.length > size && (
        <Tooltip title={collapsed ? 'Show all' : 'Collapse'}>
          <Button size="small" onClick={handleClick}>
            <Flex align="center" style={{ fontSize: '0.75rem' }}>
              {collapsed ? (
                `+${_items.length - size}`
              ) : (
                <LeftOutlined style={{ fontSize: '0.66rem' }} />
              )}
            </Flex>
          </Button>
        </Tooltip>
      )}
    </Flex>
  )
}
