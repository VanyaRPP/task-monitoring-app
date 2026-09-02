import {
  FullscreenExitOutlined,
  FullscreenOutlined,
  MoonOutlined,
  SunFilled,
  EditOutlined,
  CheckOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import useTheme from '@modules/hooks/useTheme'
import { FloatButtonItem } from '@utils/types'
import React, { useMemo, useState } from 'react'

export const useThemeFloatButton = (): FloatButtonItem => {
  const [theme, setTheme] = useTheme()

  return {
    key: 'theme',
    icon: theme === 'light' ? <MoonOutlined /> : <SunFilled />,
    tooltip: `Перемкнути на ${theme === 'light' ? 'темну' : 'світлу'} тему`,
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
      tooltip: isFullScreen ? 'Вийти' : 'Повноекранний режим',
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
      icon: isEditMode ? (
        <CheckOutlined />
      ) : (
        <EditOutlined style={{ fontSize: 18, color: '#9254de' }} />
      ),
      onClick: toggleEditMode,
      tooltip: isEditMode ? 'Exit EditMode' : 'Enter EditMode',
    }),
    [isEditMode, uniqueKey]
  )

  return [isEditMode, toggleEditMode, button]
}

export const useDragDropPanelFloatButton = (
  uniqueKey: string
): [boolean, () => void, FloatButtonItem] => {
  const [visible, setVisible] = useState(false)

  const toggleVisible = () => setVisible((prev) => !prev)

  const button = useMemo<FloatButtonItem>(
    () => ({
      key: `dragdroppanel-${uniqueKey}`,
      icon: visible ? <CloseCircleOutlined /> : <EditOutlined />,
      onClick: toggleVisible,
      tooltip: visible ? 'Вийти з режиму редагування' : 'Режим редагування',
    }),
    [visible, uniqueKey]
  )

  return [visible, toggleVisible, button]
}
