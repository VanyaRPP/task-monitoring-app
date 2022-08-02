import { Modal } from 'antd'

interface Props {
  children: React.ReactNode
  isModalVisible: boolean
  onCancel: () => void
  okText: string
  cancelText: string
  footer: any
  title: string
}

const ModalNoFooter: React.FC<Props> = ({
  children,
  isModalVisible,
  onCancel,
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
      okText={okText}
      cancelText={cancelText}
    >
      {children}
    </Modal>
  )
}

export default ModalNoFooter
