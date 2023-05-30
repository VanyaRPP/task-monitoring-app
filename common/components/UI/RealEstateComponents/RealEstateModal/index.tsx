import { useAddRealEstateMutation } from '@common/api/realestateApi/realestate.api'
import RealEstateForm from './RealEstateForm'
import { Form, Modal, message } from 'antd'
import React, { FC, useState } from 'react'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
// import AddServiceForm from '../Forms/AddServiceForm'
// import moment from 'moment'

interface Props {
  isModalOpen: boolean
  closeModal: VoidFunction
  onSubmit: () => void
}

const RealEstateModal: FC<Props> = ({ isModalOpen, closeModal }) => {
  const [form] = Form.useForm()
  const [addRealEstate] = useAddRealEstateMutation()
  const [domainId, setDomainId] = useState<string | undefined>(undefined)
  const [streetId, setStreetId] = useState<string | undefined>(undefined)
  const [matchingObject, setMatchingObject] = useState<IRealestate | null>(null)

  const handleSubmit = async (values: any) => {
    const formData: IRealestate = await form.validateFields()

    setDomainId(formData.domain)
    setStreetId(formData.street)

    const response = await addRealEstate({
      domain: formData.domain,
      street: formData.street,
      companyName: formData.companyName,
      bankInformation: formData.bankInformation,
      agreement: formData.agreement,
      phone: formData.phone,
      adminEmails: formData.adminEmails,
      pricePerMeter: formData.pricePerMeter,
      servicePricePerMeter: formData.servicePricePerMeter,
      totalArea: formData.totalArea,
      garbageCollector: formData.garbageCollector,
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
      style={{ top: 20 }}
      title={"Об'єкти нерухомості"}
      onOk={handleSubmit}
      onCancel={closeModal}
      okText={'Додати'}
      cancelText={'Відміна'}
    >
      <RealEstateForm form={form} onSubmit={handleSubmit} />
    </Modal>
  )
}

export default RealEstateModal
