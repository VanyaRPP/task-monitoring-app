import { Modal as AntModal, ButtonProps } from 'antd'
import s from './style.module.scss'
import { Form } from 'antd'
import { useState } from 'react'

interface Props {
  children: React.ReactNode
  changesForm: () => boolean
  onCancel: () => void
  onOk: () => void
  okText?: string
  cancelText?: string
  confirmLoading?: boolean
  className?: string
  maskClickIgnore?: boolean
  style?: React.CSSProperties
  open?: boolean
  okButtonProps?: ButtonProps
  title: string
  preview?: boolean
}

const Modal: React.FC<Props> = ({
  children,
  changesForm,
  onCancel,
  onOk,
  okText,
  cancelText,
  confirmLoading,
  className,
  maskClickIgnore,
  style,
  title,
  okButtonProps,
  open = true,
  preview,
}) => {
  const handleCancel = () => {
    if (changesForm()) {
      AntModal.confirm({
        title: 'Ви впевнені, що хочете вийти?',
        content: 'Всі незбережені дані будуть втрачені',
        okText: 'Так',
        cancelText: 'Ні',
        onOk: onCancel,
      })
    } else {
      onCancel()
    }
  }

  return (
    <AntModal
      confirmLoading={confirmLoading}
      open={open}
      maskClosable={!maskClickIgnore}
      title={title}
      onCancel={handleCancel}
      onOk={onOk}
      cancelText={cancelText}
      okText={okText}
      className={className ? className : s.Modal}
      style={style}
      okButtonProps={okButtonProps}
    >
      {children}
    </AntModal>
  )
}

export default Modal
