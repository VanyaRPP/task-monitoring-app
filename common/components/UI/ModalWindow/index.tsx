import { Modal as AntModal } from 'antd'
import s from './style.module.scss'

interface Props {
  children: React.ReactNode
  onCancel: () => void
  onOk: () => void
  okText?: string
  cancelText?: string
  confirmLoading?: boolean
  className?: string
  maskClickIgnore?: boolean
  style?: React.CSSProperties
  open?: boolean
  // footer: any
  title: string
}

const Modal: React.FC<Props> = ({
  children,
  onCancel,
  onOk,
  okText,
  cancelText,
  confirmLoading,
  className,
  maskClickIgnore,
  style,
  // footer,
  title,
  open = true,
}) => {
  return (
    <AntModal
      confirmLoading={confirmLoading}  
      open={open}
      maskClosable={!maskClickIgnore}
      title={title}
      // footer={footer}
      onCancel={() => {
        AntModal.confirm({
          title: 'Ви впевнені, що хочете закрити форму?',
          content: 'Введені вами дані не будуть збережені',
          onOk: onCancel,
          cancelText: 'Ні',
          okText: 'Так'
        });
      }}
      onOk={onOk}
      okText={okText}
      cancelText={cancelText}
      className={className ? className : s.Modal}
      style={style}
    >
      {children}
    </AntModal>
  )
}

export default Modal;
