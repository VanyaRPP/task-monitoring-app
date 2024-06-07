import { Col, Divider, Row } from 'antd'
import React, { useMemo } from 'react'

export interface DividedSpaceProps {
  direction?: 'vertical' | 'horizontal'
  hidden?: boolean
  size?: 'small' | 'middle' | 'large' | number
  className?: string
  children?: React.ReactNode
  style?: React.CSSProperties
}

export const DividedSpace: React.FC<DividedSpaceProps> = ({
  direction = 'horizontal',
  hidden = false,
  size = 'middle',
  className,
  children,
  style,
}) => {
  const items = useMemo<React.ReactNode[]>(() => {
    const nodes = React.Children.toArray(children) as React.ReactNode[]

    if (hidden) {
      return nodes
    }

    return nodes.reduce<React.ReactNode[]>((acc, node, index) => {
      const divider = (
        <Divider
          key={`divider-${index}`}
          type={direction === 'vertical' ? 'horizontal' : 'vertical'}
          style={{ margin: 0, height: '100%' }}
        />
      )

      acc.push(<Col style={{ flex: 1 }}>{node}</Col>)

      if (index < nodes.length - 1) {
        acc.push(<Col>{divider}</Col>)
      }

      return acc
    }, [])
  }, [children, hidden, direction])

  return (
    <Row
      className={className}
      style={{
        flexDirection: direction === 'vertical' ? 'column' : 'row',
        flexWrap: 'nowrap',
        gap:
          size === 'small'
            ? 4
            : size === 'middle'
            ? 8
            : size === 'large'
            ? 16
            : size,
        ...style,
      }}
    >
      {items}
    </Row>
  )
}
