import { addButton, removeButton } from '@modules/store/floatButtonSlice'
import { useFullScreenFloatButton } from '@modules/hooks/useFloatButton'
import { useDispatch } from 'react-redux'
import React, { useEffect } from 'react'

import styles from './styled.module.scss'
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons'
import { Button } from 'antd'

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
