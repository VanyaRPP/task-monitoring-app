import { InfoCircleOutlined } from '@ant-design/icons'
import { Popover } from 'antd'
import React from 'react'

interface ServiceNoteHintProps {
  note?: string | null
}

const ServiceNoteHint: React.FC<ServiceNoteHintProps> = ({ note }) => {
  if (!note || !note.trim()) return null

  return (
    <Popover
      trigger={['hover', 'click']}
      placement="top"
      content={
        <div
          data-testid="service-note-content"
          style={{
            maxWidth: 320,
            maxHeight: 240,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
          }}
        >
          {note}
        </div>
      }
    >
      <InfoCircleOutlined
        role="button"
        tabIndex={0}
        aria-label="Примітка до послуги"
        data-testid="service-note-indicator"
        style={{ color: '#722ed1', marginLeft: 6, cursor: 'pointer' }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      />
    </Popover>
  )
}

export default ServiceNoteHint
