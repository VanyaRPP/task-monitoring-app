import { Modal as AntModal, ButtonProps } from 'antd'
import s from './style.module.scss'

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
  cancelButtonProps?: ButtonProps
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
  cancelButtonProps,
}) => {
  const handleCancel = () => {
    const isSingleTabAndViewMode = changesForm() && open && preview

    if (isSingleTabAndViewMode || preview) {
      onCancel()
    } else {
      AntModal.confirm({
        title: 'Ви впевнені, що хочете вийти?',
        content: 'Всі незбережені дані будуть втрачені',
        okText: 'Так',
        cancelText: 'Ні',
        onOk: onCancel,
      })
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
      okText={okText}
      cancelText={cancelText}
      className={className ? className : s.Modal}
      style={style}
      okButtonProps={okButtonProps}
      cancelButtonProps={
        preview ? { style: { display: 'none' } } : cancelButtonProps
      }
    >
      {children}
    </AntModal>
  )
}

export default Modal
