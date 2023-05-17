import { useAddDomainMutation } from '@common/api/domainApi/domain.api'
import { Form, Modal, message } from 'antd'
import React, { FC } from 'react'
import { Domainstate } from '@common/api/domainApi/domain.api.types'
import DomainForm from './DomainForm'

interface Props {
  isModalOpen: boolean
  closeModal: VoidFunction
}

const DomainModal: FC<Props> = ({ isModalOpen, closeModal }) => {
  const [form] = Form.useForm()
  const [addDomainEstate] = useAddDomainMutation()

  const handleSubmit = async () => {
    const formData: Domainstate = await form.validateFields()

    const response = await addDomainEstate({
      name: formData.name,
      address: formData.address,
      adminEmails: formData.adminEmails,
      streets: formData.streets, //  Streets id
      description: formData.description,
      bankInformation: formData.bankInformation,
      phone: formData.phone,
      email: formData.email,
    })

    if ('data' in response) {
      form.resetFields()
      closeModal()
      message.success('Додано')
    } else {
      message.error('Помилка при додаванні')
    }
  }

  return (
    <Modal
      open={isModalOpen}
      title={'Домени'}
      onOk={handleSubmit}
      onCancel={closeModal}
      okText={'Додати'}
      cancelText={'Відміна'}
    >
      <DomainForm form={form} />
    </Modal>
  )
}

export default DomainModal
