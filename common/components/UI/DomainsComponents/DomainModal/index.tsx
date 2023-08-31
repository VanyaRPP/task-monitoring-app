import {
  useAddDomainMutation,
  useEditDomainMutation,
} from '@common/api/domainApi/domain.api'
import { Form, Modal, message } from 'antd'
import React, { FC } from 'react'
import {
  IDomainModel,
  IExtendedDomain,
} from '@common/api/domainApi/domain.api.types'
import DomainForm from './DomainForm'

interface Props {
  currentDomain: IExtendedDomain
  closeModal: VoidFunction
}

const DomainModal: FC<Props> = ({ currentDomain, closeModal }) => {
  const [form] = Form.useForm()
  const [addDomainEstate] = useAddDomainMutation()
  const [editDomain] = useEditDomainMutation()

  const handleSubmit = async () => {
    const formData: IDomainModel = await form.validateFields()

    const domainData = {
      name: formData.name,
      adminEmails: formData.adminEmails,
      streets: formData.streets.some((i: any) => i.value)
        ? formData.streets.map((i: any) => i.value)
        : formData.streets,
      description: formData.description,
    }

    const response = currentDomain
      ? await editDomain({
          _id: currentDomain?._id,
          ...domainData,
        })
      : await addDomainEstate(domainData)

    if ('data' in response) {
      form.resetFields()
      closeModal()
      const action = currentDomain ? 'Збережено' : 'Додано'
      message.success(action)
    } else {
      const action = currentDomain ? 'збереженні' : 'додаванні'
      message.error(`Помилка при ${action} домену`)
    }
  }

  return (
    <Modal
      open={true}
      title={'Домени'}
      onOk={handleSubmit}
      onCancel={closeModal}
      okText={currentDomain ? 'Зберегти' : 'Додати'}
      cancelText={'Відміна'}
    >
      <DomainForm form={form} currentDomain={currentDomain} />
    </Modal>
  )
}

export default DomainModal
