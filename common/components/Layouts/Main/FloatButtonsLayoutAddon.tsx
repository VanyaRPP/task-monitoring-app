import { useThemeFloatButton } from '@modules/hooks/useThemeFloatButton'
import { SettingOutlined } from '@ant-design/icons'
import React, { ReactNode } from 'react'
import { FloatButton } from 'antd'

export type FloatButtonItem = {
  key: string
  icon: ReactNode
  onClick: () => void
  tooltip?: string
}

type FloatButtonPlacementProps = {
  buttons?: FloatButtonItem[]
}

export const FloatButtonsLayoutAddon: React.FC<FloatButtonPlacementProps> = ({
  buttons = [],
}) => {
  const themeBtn = useThemeFloatButton()

  if (buttons.length > 1) {
    return (
      <FloatButton.Group
        type="primary"
        shape="square"
        trigger="hover"
        style={{ right: 24, bottom: 24 }}
        icon={<SettingOutlined />}
      >
        {buttons.map((btn) => (
          <FloatButton
            key={btn.key}
            icon={btn.icon}
            onClick={btn.onClick}
            tooltip={btn.tooltip}
          />
        ))}
      </FloatButton.Group>
    )
  }

  return (
    <FloatButton
      key={themeBtn.key}
      icon={themeBtn.icon}
      onClick={themeBtn.onClick}
      tooltip={themeBtn.tooltip}
      type="primary"
      style={{ right: 24, bottom: 24 }}
    />
  )
}
