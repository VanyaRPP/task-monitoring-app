import { useAddServiceMutation } from '@common/api/serviceApi/service.api'
import { Form, message, Modal } from 'antd'
import React, { FC, useEffect } from 'react'
import AddServiceForm from '../Forms/AddServiceForm'
import moment from 'moment'
import { IExtendedService } from '@common/api/serviceApi/service.api.types'

interface Props {
  edit: boolean
  closeModal: VoidFunction
  currentService: IExtendedService
}

type FormData = {
  date: Date
  domain: string
  street: string
  rentPrice: number
  electricityPrice: number
  waterPrice: number
  inflicionPrice: number
  description: string
}

const AddServiceModal: FC<Props> = ({ edit, closeModal, currentService }) => {
  const [form] = Form.useForm()
  const [addService, { isLoading }] = useAddServiceMutation()

  const handleSubmit = async () => {
    const formData: FormData = await form.validateFields()

    const response = await addService({
      domain: formData.domain,
      street: formData.street,
      date: moment(formData.date).toDate(),
      rentPrice: formData.rentPrice,
      electricityPrice: formData.electricityPrice,
      waterPrice: formData.waterPrice,
      inflicionPrice: formData.inflicionPrice,
      description: formData.description,
      serviceId: currentService._id
    })

    // eslint-disable-next-line no-console
    console.log('res', response)
    if ('data' in response) {
      form.resetFields()
      closeModal()
      message.success('Додано')
    } else {
      message.error('Помилка при додаванні рахунку')
    }
  }

  return (
    <Modal
      open={true}
      title="Ціна на послуги в місяць"
      onOk={handleSubmit}
      onCancel={closeModal}
      okText={edit ? 'Редагувати' : 'Додати'}
      cancelText={'Відміна'}
      confirmLoading={isLoading}
    >
      <AddServiceForm form={form} edit={edit} currentService={currentService} />
    </Modal>
  )
}

export default AddServiceModal
