import { Modal } from 'antd'
import React, { FC } from 'react'

interface Props {
  isModalOpen: boolean
  closeModal: VoidFunction
}

const AddPaymentModal: FC<Props> = ({ isModalOpen, closeModal }) => {
  return (
    <Modal
      visible={isModalOpen}
      title="Додавання проплати"
      onOk={closeModal}
      onCancel={closeModal}
      okText={'Додати'}
      cancelText={'Відміна'}
    >
      <p>test</p>
    </Modal>
  )
}

export default AddPaymentModal
