import { useThemeFloatButton } from '@modules/hooks/useFloatButton'
import { useAppSelector } from '@modules/store/hooks'
import { SettingFilled } from '@ant-design/icons'
import { FloatButtonItem } from '@utils/types'
import { FloatButton } from 'antd'
import React from 'react'

type FloatButtonPlacementProps = {
  buttons?: FloatButtonItem[]
}

export const FloatButtonsLayoutAddon: React.FC<FloatButtonPlacementProps> = ({
  buttons = [],
}) => {
  const themeBtn = useThemeFloatButton()
  const storedButtons = useAppSelector((state) => state.floatButtons.buttons)

  const allButtons = [...buttons, ...storedButtons, themeBtn]
  
  if (allButtons.length > 1) {
    return (
      <FloatButton.Group
        type="primary"
        shape="square"
        trigger="hover"
        style={{ right: 24, bottom: 24 }}
        icon={<SettingFilled />}
      >
        {allButtons.map((btn) => (
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
