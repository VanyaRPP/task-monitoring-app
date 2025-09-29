import React from 'react'
import { Checkbox, Divider, theme } from 'antd'
import type { WidgetKey } from '@components/DashboardPage'

interface Props {
  hidden: WidgetKey[]
  onChange: (updated: WidgetKey[]) => void
  available: WidgetKey[]
  labels: Record<WidgetKey, string>
}

const WidgetVisibilityMenu: React.FC<Props> = ({ hidden, onChange, available, labels }) => {
  const { token } = theme.useToken()

  return (
    <div
      style={{
        maxHeight: 300,
        overflowY: 'auto',
        padding: '8px 0',
        backgroundColor: token.colorBgContainer,
        borderRadius: 8,
      }}
    >
      <Checkbox.Group
        value={hidden}
        onChange={(checked) => onChange(checked as WidgetKey[])}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          width: '100%',
        }}
      >
        {available.map((key, index) => (
          <React.Fragment key={key}>
            <Checkbox
              value={key}
              style={{
                padding: '6px 12px',
                width: '100%',
                borderRadius: 6,
              }}
              className="custom-checkbox"
            >
              {labels[key]}
            </Checkbox>
            {index < available.length - 1 && (
              <Divider style={{ margin: '0' }} />
            )}
          </React.Fragment>
        ))}
      </Checkbox.Group>

      <style>
        {`
          .custom-checkbox .ant-checkbox-checked .ant-checkbox-inner {
            background-color: #722ed1; /* фиолетовый */
            border-color: #722ed1;
          }

          .custom-checkbox .ant-checkbox-wrapper-checked {
            background: rgba(114, 46, 209, 0.12); /* подсветка строки */
          }

          /* при наведении */
          .custom-checkbox:hover {
            background: rgba(114, 46, 209, 0.08);
          }
        `}
      </style>
    </div>
  )
}

export default WidgetVisibilityMenu
