import { Modal } from 'antd'

type PropsType = {
  children: React.ReactNode
  isModalVisible: boolean
  onCancel: () => void
  onOk: () => void
  okText: string
  cancelText: string
}

const ModalWindow: React.FC<PropsType> = ({
  children,
  isModalVisible,
  onCancel,
  onOk,
  okText,
  cancelText,
}) => {
  return (
    <Modal
      visible={isModalVisible}
      title="Add task"
      onCancel={onCancel}
      onOk={onOk}
      okText={okText}
      cancelText={cancelText}
    >
      {children}
    </Modal>
  )
}

export default ModalWindow
