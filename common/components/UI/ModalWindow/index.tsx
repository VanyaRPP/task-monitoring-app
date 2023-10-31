import { Modal } from 'antd'
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

const ModalWindow: React.FC<Props> = ({
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
    <Modal
      confirmLoading={confirmLoading}  
      open={open}
      maskClosable={!maskClickIgnore}
      title={title}
      // footer={footer}
      onCancel={() => {
        Modal.confirm({
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
    </Modal>
  )
}

export default ModalWindow
