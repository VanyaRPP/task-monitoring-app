import {
  useAddRealEstateMutation,
  useEditRealEstateMutation,
} from '@common/api/realestateApi/realestate.api'
import RealEstateForm from './RealEstateForm'
import { Form, message } from 'antd'
import React, { FC, useEffect } from 'react'
import {
  IExtendedRealestate,
  IRealestate,
} from '@common/api/realestateApi/realestate.api.types'
import Modal from '../../ModalWindow'
// import AddServiceForm from '../Forms/AddServiceForm'
// import moment from 'moment'

interface Props {
  closeModal: VoidFunction
  currentRealEstate?: IExtendedRealestate
  editable?: boolean
}

const RealEstateModal: FC<Props> = ({
  closeModal,
  currentRealEstate,
  editable,
}) => {
  const [form] = Form.useForm()
  const [addRealEstate] = useAddRealEstateMutation()
  const [editRealEstate] = useEditRealEstateMutation()

  useEffect(() => {
    const initialValues = {
      domain: currentRealEstate?.domain?.name,
      street:
        currentRealEstate?.street &&
        `${currentRealEstate.street.address} (м. ${currentRealEstate.street.city})`,
      companyName: currentRealEstate?.companyName || '',
      description: currentRealEstate?.description || '',
      adminEmails: currentRealEstate?.adminEmails || [],
      pricePerMeter: currentRealEstate?.pricePerMeter || 0,
      servicePricePerMeter: currentRealEstate?.servicePricePerMeter || 0,
      totalArea: currentRealEstate?.totalArea || 0,
      garbageCollector: currentRealEstate?.garbageCollector || false,
      rentPart: currentRealEstate?.rentPart || 0,
      inflicion: currentRealEstate?.inflicion || false,
      waterPart: currentRealEstate?.waterPart || 0,
      discount: currentRealEstate?.discount || 0,
      cleaning: currentRealEstate?.cleaning || 0,
    }
    form.setFieldsValue(initialValues)
  }, [currentRealEstate, form])

  const handleSubmit = async () => {
    const formData: IRealestate = await form.validateFields()
    const realEstateData = {
      domain: currentRealEstate?.domain || formData.domain,
      street: currentRealEstate?.street || formData.street,
      companyName: formData.companyName,
      description: formData.description,
      adminEmails: formData.adminEmails,
      pricePerMeter: formData.pricePerMeter,
      servicePricePerMeter: formData.servicePricePerMeter,
      totalArea: formData.totalArea,
      garbageCollector: formData.garbageCollector,
      rentPart: formData.rentPart,
      inflicion: formData.inflicion,
      waterPart: formData.waterPart,
      discount:
        formData.discount > 0 ? formData.discount * -1 : formData.discount,
      cleaning: formData.cleaning,
    }

    const response = currentRealEstate
      ? await editRealEstate({
          _id: currentRealEstate?._id,
          ...realEstateData,
        })
      : await addRealEstate(realEstateData)

    if ('data' in response) {
      form.resetFields()
      closeModal()
      const action = currentRealEstate ? 'Збережено' : 'Додано'
      message.success(action)
    } else {
      const action = currentRealEstate ? 'збереженні' : 'додаванні'
      message.error(`Помилка при ${action}`)
    }
  }

  return (
    <Modal
      style={{ top: 20 }}
      title={'Компанії'}
      onOk={handleSubmit}
      changesForm={() => form.isFieldsTouched()}
      onCancel={closeModal}
      okText={currentRealEstate ? 'Зберегти' : 'Додати'}
      cancelText={'Відміна'}
      okButtonProps={{ style: { ...(!editable && { display: 'none' }) } }}
      preview={!editable}
    >
      <RealEstateForm
        form={form}
        currentRealEstate={currentRealEstate}
        editable={editable}
      />
    </Modal>
  )
}

export default RealEstateModal
