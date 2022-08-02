import { Modal } from 'antd'

interface Props {
  children: React.ReactNode
  isModalVisible: boolean
  onCancel: () => void
  // onOk: () => void
  okText: string
  cancelText: string
  footer: any
  title: string
}

const ModalWindow: React.FC<Props> = ({
  children,
  isModalVisible,
  onCancel,
  // onOk,
  okText,
  cancelText,
  footer,
  title,
}) => {
  return (
    <Modal
      maskClosable={false}
      visible={isModalVisible}
      title={title}
      footer={footer}
      onCancel={onCancel}
      // onOk={onOk}
      okText={okText}
      cancelText={cancelText}
    >
      {children}
    </Modal>
  )
}

export default ModalWindow
