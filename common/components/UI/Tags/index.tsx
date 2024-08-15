import { LeftOutlined } from '@ant-design/icons'
import { Button, Flex, FlexProps, Tag, Tooltip } from 'antd'
import { useCallback, useMemo, useState } from 'react'

export interface TagsProps<T = unknown>
  extends Omit<FlexProps, 'children' | 'title'> {
  /**
   * The array of items to be displayed as tags.
   */
  items?: T[]

  /**
   * The maximum number of items to display before collapsing.
   */
  size?: number

  /**
   * Function to render each item as a React node.
   */
  render?: (item: T, index: number, items: T[]) => React.ReactNode

  /**
   * The title or label to display before the tags.
   */
  title?: React.ReactNode

  /**
   * The placeholder to display when there are no items.
   */
  placeholder?: React.ReactNode
}

/**
 * Displays a list of items as tags with a collapsible feature.
 *
 * @template T The type of the items to render.
 * @param props The properties for the `Tags` component.
 * @returns The list of items as tags with a collapsible feature.
 */
export const Tags = <T,>({
  items: _items = [],
  size = 5,
  render = (item, index, items) => (
    <Tag key={index} bordered={false} color="blue" style={{ margin: 0 }}>
      {item as any}
    </Tag>
  ),
  title,
  placeholder = null,
  ...rest
}: TagsProps<T>) => {
  const [collapsed, setCollapsed] = useState<boolean>(true)

  const items = useMemo(() => {
    return (collapsed ? _items?.slice(0, size) : _items) || []
  }, [_items, size, collapsed])

  const handleClick = useCallback(() => {
    setCollapsed(!collapsed)
  }, [collapsed, setCollapsed])

  return (
    <Flex gap={8} {...rest}>
      {title}

      {items.length > 0
        ? items.map((item, index) => render(item, index, items))
        : placeholder}

      {_items.length > size && (
        <Tooltip title={collapsed ? 'Показати всі' : 'Приховати'}>
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
