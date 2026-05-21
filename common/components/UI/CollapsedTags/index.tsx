import { Tag, Tooltip } from 'antd'
import { useState } from 'react'
import { LeftOutlined } from '@ant-design/icons'

interface CollapsedTagsProps {
  items: string[]
  maxVisible?: number
}

const CollapsedTags: React.FC<CollapsedTagsProps> = ({
  items,
  maxVisible = 2,
}) => {
  const [expanded, setExpanded] = useState(false)

  const visibleItems = expanded ? items : items.slice(0, maxVisible)
  const hiddenItems = items.slice(maxVisible)

  return (
    <>
      {visibleItems.map((item) => (
        <Tag key={item}>{item}</Tag>
      ))}
      {!expanded && hiddenItems.length > 0 && (
        <Tooltip title={hiddenItems.join(', ')}>
          <Tag onClick={() => setExpanded(true)} style={{ cursor: 'pointer' }}>
            +{hiddenItems.length}
          </Tag>
        </Tooltip>
      )}
      {expanded && items.length > maxVisible && (
        <Tag onClick={() => setExpanded(false)} style={{ cursor: 'pointer' }}>
          <LeftOutlined />
        </Tag>
      )}
    </>
  )
}
export default CollapsedTags
