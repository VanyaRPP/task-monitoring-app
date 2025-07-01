import { useFullScreenFloatButton } from '@modules/hooks/useFloatButton'
import { addButton, removeButton } from '@modules/store/floatButtonSlice'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons'
import { Button } from 'antd'
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
  const [isFullScreen, toggleFullScreen, floatButton] =
    useFullScreenFloatButton(unicKey || 'default')

  useEffect(() => {
    dispatch(addButton(floatButton))
    return () => {
      dispatch(removeButton(floatButton.key))
    }
  }, [dispatch, floatButton])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        toggleFullScreen?.()
      }
    }

    const handlePopState = () => {
      if (isFullScreen) {
        toggleFullScreen?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('popstate', handlePopState)

    if (isFullScreen) {
      window.history.pushState({ fullScreen: true }, '')
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isFullScreen, toggleFullScreen])

  return (
    <>
      {isFullScreen && (
        <Button
          className={styles.toggleButton}
          onClick={toggleFullScreen}
          type="default"
          icon={
            isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
          }
        />
      )}

      <div
        className={`${styles.contentWrapper} ${
          isFullScreen ? styles.fullScreen : ''
        }`}
      >
        {children}
      </div>
    </>
  )
}

export default FullScreenWrapper
