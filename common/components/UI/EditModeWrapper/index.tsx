import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { addButton, removeButton } from '@modules/store/floatButtonSlice'
import { useEditModelFloatButton } from '@modules/hooks/useFloatButton'
import styles from './styled.module.scss' 
import { Button } from 'antd' 
import {
  EditOutlined,
  CheckOutlined,
} from '@ant-design/icons'

interface EditModeWrapperProps {
  children: React.ReactNode
  uniqueKey?: string
}

const EditModeWrapper: React.FC<EditModeWrapperProps> = ({
  children,
  uniqueKey 
}) => {
  const dispatch = useDispatch()

  const [isEditMode, toggleEditMode, floatButton] = useEditModelFloatButton(
    uniqueKey || 'default'
  )

  useEffect(() => {
    dispatch(addButton(floatButton))
    return () => {
      dispatch(removeButton(floatButton.key))
    }
  }, [dispatch, floatButton])

  return (
    <>
      {isEditMode && (
        <Button
          className={styles.toggleButton}
          onClick={toggleEditMode}
          type="default"
          icon={isEditMode ? <CheckOutlined /> : <EditOutlined />}
        />
      )}

        {children}

    </>
  )
}


export default EditModeWrapper
