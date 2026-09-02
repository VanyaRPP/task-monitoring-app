import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useRouter } from 'next/router'
import { useFullScreenFloatButton } from '@modules/hooks/useFloatButton'
import { addButton, removeButton } from '@modules/store/floatButtonSlice'
import { FullscreenExitOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import styles from './styled.module.scss'

interface FullScreenWrapperProps {
  children: React.ReactNode
  unicKey?: string
}

const FullScreenWrapper: React.FC<FullScreenWrapperProps> = ({
  children,
  unicKey,
}) => {
  const dispatch = useDispatch()
  const { pathname } = useRouter()
  const isDashboardRoute =
    pathname?.includes('/dashboard') ||
    pathname?.includes('/panel') ||
    pathname === '/'
  const allowFullscreen = !isDashboardRoute
  const [isFullScreen, toggleFullScreen, floatButton] =
    useFullScreenFloatButton(unicKey || 'default')

  useEffect(() => {
    if (!allowFullscreen) return

    dispatch(addButton(floatButton))

    return () => {
      dispatch(removeButton(floatButton.key))
    }
  }, [dispatch, floatButton, allowFullscreen])

  useEffect(() => {
    if (!allowFullscreen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) toggleFullScreen?.()
    }
    const handlePopState = () => {
      if (isFullScreen) toggleFullScreen?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('popstate', handlePopState)
    if (isFullScreen) window.history.pushState({ fullScreen: true }, '')

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isFullScreen, toggleFullScreen, allowFullscreen])

  return (
    <>
      {allowFullscreen && isFullScreen && (
        <Tooltip title="Вийти з Повноекранного" placement="left">
          <Button
            className={styles.toggleButton}
            onClick={toggleFullScreen}
            type="default"
            icon={<FullscreenExitOutlined />}
          />
        </Tooltip>
      )}

      <div
        className={`${styles.contentWrapper} ${
          allowFullscreen && isFullScreen ? styles.fullScreen : ''
        }`}
      >
        {children}
      </div>
    </>
  )
}

export default FullScreenWrapper
