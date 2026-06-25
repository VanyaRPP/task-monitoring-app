import {
  useAddServiceMutation,
  useEditServiceMutation,
} from '@common/api/serviceApi/service.api'
import { IService } from '@common/api/serviceApi/service.api.types'
import Modal from '@components/UI/ModalWindow'
import { Form, message } from 'antd'
import dayjs from 'dayjs'
import { FC, useState } from 'react'
import AddServiceForm from '../Forms/AddServiceForm'
import PreviewServiceForm from '../Forms/PreviewServiceForm'
import { ObjectId } from 'mongoose'

interface Props {
  closeModal: VoidFunction
  currentService?: IService
  serviceActions?: {
    edit: boolean
    preview: boolean
  }
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
  inflicionPrice: number
  description: string
  customServices: {
    _id: ObjectId
    label: string
    fieldName: string
    price: number
  }[]
  losses: number
  consumedElectricity?: number
  generalElectricity?: number
  isVAT?: boolean
}

const AddServiceModal: FC<Props> = ({
  closeModal,
  currentService,
  serviceActions,
}) => {
  const [form] = Form.useForm()
  const [isValueChanged, setIsValueChanged] = useState(false)
  const [addService, { isLoading: isAddingLoading }] = useAddServiceMutation()
  const [editService, { isLoading: isEditingLoading }] =
    useEditServiceMutation()
  const { edit, preview } = serviceActions

  const handleSubmit = async () => {
    const formData: FormData = await form.validateFields()

    const picked = dayjs(formData.date);
    const serviceData = {
      domain: currentService?.domain?._id?.toString() || formData.domain,
      street: currentService?.street?._id?.toString() || formData.street,
      date: new Date(Date.UTC(picked.year(), picked.month(), 1, 12, 0, 0)),
      rentPrice:
        formData.customServices?.find((c) => c.fieldName === 'rentPrice')
          ?.price ?? formData?.rentPrice,
      electricityPrice:
        formData?.customServices?.find(
          (c) => c.fieldName === 'electricityPrice'
        )?.price ?? formData?.electricityPrice,
      waterPrice:
        formData?.customServices?.find((c) => c.fieldName === 'waterPrice')
          ?.price ?? formData?.waterPrice,
      waterPriceTotal:
        formData?.customServices?.find((c) => c.fieldName === 'waterPriceTotal')
          ?.price ?? formData?.waterPriceTotal,
      garbageCollectorPrice:
        formData?.customServices?.find(
          (c) => c.fieldName === 'garbageCollectorPrice'
        )?.price ||
        formData?.garbageCollectorPrice ||
        0,
      inflicionPrice:
        formData?.customServices?.find((c) => c.fieldName === 'inflicionPrice')
          ?.price ||
        formData?.inflicionPrice ||
        0,
      description: formData?.description || '',
      customServices: formData?.customServices || [],
      losses: formData?.losses || null,
      consumedElectricity: formData?.consumedElectricity || null,
      generalElectricity: formData?.generalElectricity || null,
      isVAT: formData?.isVAT || true,
    }
    const response = currentService
      ? await editService({
        _id: currentService?._id?.toString(),
        ...serviceData,
      })
      : await addService(serviceData)

    if ('data' in response) {
      form.resetFields()
      closeModal()
      const action = currentService ? 'Збережено' : 'Додано'
      message.success(action)

      const channel = new BroadcastChannel('payments_sync_channel')
      channel.postMessage('PAYMENT_CREATED')

      setTimeout(() => channel.close(), 100)
    } else {
      const action = currentService ? 'збереженні' : 'додаванні'
      message.error(`Помилка при ${action} рахунку`)
    }
  }

  return (
    <Modal
      title="Ціна на послуги в місяць"
      onOk={handleSubmit}
      changed={() => isValueChanged}
      onCancel={() => {
        form.resetFields()
        closeModal()
      }}
      okText={edit ? 'Зберегти' : !preview && 'Додати'}
      okButtonProps={{ style: { ...(preview && { display: 'none' }) } }}
      cancelText={preview ? 'Закрити' : 'Відміна'}
      confirmLoading={isAddingLoading || isEditingLoading}
    >
      {preview ? (
        <PreviewServiceForm form={form} currentService={currentService} />
      ) : (
        <AddServiceForm
          form={form}
          edit={edit}
          currentService={currentService}
          setIsValueChanged={setIsValueChanged}
        />
      )}
    </Modal>
  )
}

export default AddServiceModal
