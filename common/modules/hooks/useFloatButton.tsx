import {
  FullscreenExitOutlined,
  FullscreenOutlined,
  MoonOutlined,
  SunFilled,
  EditOutlined,
  CheckOutlined,
} from '@ant-design/icons'
import useTheme from '@modules/hooks/useTheme'
import { FloatButtonItem } from '@utils/types'
import React, { useMemo, useState } from 'react'

export const useThemeFloatButton = (): FloatButtonItem => {
  const [theme, setTheme] = useTheme()

  return {
    key: 'theme',
    icon: theme === 'light' ? <MoonOutlined /> : <SunFilled />,
    tooltip: `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`,
    onClick: () => setTheme(theme === 'light' ? 'dark' : 'light'),
  }
}

export const useFullScreenFloatButton = (
  uniqueKey: string
): [boolean, () => void, FloatButtonItem] => {
  const [isFullScreen, setIsFullScreen] = useState(false)

  const toggleFullScreen = () => setIsFullScreen((prev) => !prev)

  const button = useMemo<FloatButtonItem>(
    () => ({
      key: `fullscreen-${uniqueKey}`,
      icon: isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />,
      onClick: toggleFullScreen,
      tooltip: isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen',
    }),
    [isFullScreen, uniqueKey]
  )

  return [isFullScreen, toggleFullScreen, button]
}

export const useEditModelFloatButton = (
  uniqueKey: string
): [boolean, () => void, FloatButtonItem] => {
  const [isEditMode, setIsEditMode] = useState(false)

  const toggleEditMode = () => setIsEditMode((prev) => !prev)

  const button = useMemo<FloatButtonItem>(
    () => ({
      key: `editmode-${uniqueKey}`,
      icon: isEditMode ? <CheckOutlined /> : <EditOutlined />,
      onClick: toggleEditMode,
      tooltip: isEditMode ? 'Exit EditMode' : 'Enter EditMode',
    }),
    [isEditMode, uniqueKey]
  )

  return [isEditMode, toggleEditMode, button]
}
