import {
  useAddServiceMutation,
  useEditServiceMutation,
} from '@common/api/serviceApi/service.api'
import { Form, message } from 'antd'
import React, { FC } from 'react'
import AddServiceForm from '../Forms/AddServiceForm'
import moment from 'moment'
import { IExtendedService } from '@common/api/serviceApi/service.api.types'
import Modal from '../UI/ModalWindow'

interface Props {
  closeModal: VoidFunction
  currentService?: IExtendedService
}

type FormData = {
  date: Date
  domain: string
  street: string
  rentPrice: number
  electricityPrice: number
  waterPrice: number
  waterPriceTotal: number
  garbageCollectorPrice: number
  publicElectricUtilityPrice: number
  inflicionPrice: number
  description: string
}

const AddServiceModal: FC<Props> = ({ closeModal, currentService }) => {
  const [form] = Form.useForm()
  const [addService, { isLoading: isAddingLoading }] = useAddServiceMutation()
  const [editService, { isLoading: isEditingLoading }] =
    useEditServiceMutation()
  const edit = !!currentService
  const handleSubmit = async () => {
    const formData: FormData = await form.validateFields()
    const serviceData = {
      domain: currentService?.domain || formData.domain,
      street: currentService?.street || formData.street,
      date: moment(formData.date).toDate(),
      rentPrice: formData.rentPrice,
      electricityPrice: formData.electricityPrice,
      waterPrice: formData.waterPrice,
      waterPriceTotal: formData.waterPriceTotal,
      garbageCollectorPrice: formData.garbageCollectorPrice || 0,
      publicElectricUtilityPrice: formData.publicElectricUtilityPrice || 0,
      inflicionPrice: formData.inflicionPrice || 0,
      description: formData.description || '',
    }
    const response = currentService
      ? await editService({
          _id: currentService?._id,
          ...serviceData,
        })
      : await addService(serviceData)

    if ('data' in response) {
      form.resetFields()
      closeModal()
      const action = currentService ? 'Збережено' : 'Додано'
      message.success(action)
    } else {
      const action = currentService ? 'збереженні' : 'додаванні'
      message.error(`Помилка при ${action} рахунку`)
    }
  }

  return (
    <Modal
      title="Ціна на послуги в місяць"
      onOk={handleSubmit}
      onCancel={() => {
        form.resetFields()
        closeModal()
      }}
      okText={edit ? 'Зберегти' : 'Додати'}
      cancelText={'Відміна'}
      confirmLoading={isAddingLoading || isEditingLoading}
    >
      <AddServiceForm form={form} edit={edit} currentService={currentService} />
    </Modal>
  )
}

export default AddServiceModal
