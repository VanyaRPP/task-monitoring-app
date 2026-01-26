import {
  useAddRealEstateMutation,
  useEditRealEstateMutation,
} from '@common/api/realestateApi/realestate.api'
import React, { FC, useEffect, useState } from 'react'
import {
  IExtendedRealestate,
  IRealestate,
} from '@common/api/realestateApi/realestate.api.types'
import { Form, message, Tooltip } from 'antd'
import Modal from '../../ModalWindow'
import RealEstateForm from './RealEstateForm'
import {
  useGetCustomServicesByDomainQuery,
} from '@common/api/customServicesApi/customServices.api'

interface Props {
  chosenRealEstate: { domain: string }
  closeModal: VoidFunction
  currentRealEstate?: IExtendedRealestate
  editable?: boolean
}

const RealEstateModal: FC<Props> = ({
  chosenRealEstate,
  closeModal,
  currentRealEstate,
  editable,
}) => {
  const [form] = Form.useForm()
  const [isValueChanged, setIsValueChanged] = useState(false)
  const [addRealEstate] = useAddRealEstateMutation()
  const [editRealEstate] = useEditRealEstateMutation()
  const domainId = Form.useWatch('domain', form)
  const { data: customDomainServices } = useGetCustomServicesByDomainQuery(
    { domainId: currentRealEstate?.domain?._id || domainId },
    { skip: !domainId && !currentRealEstate?.domain?._id }
  )

  const filteredServicesPrice = (customServices) => {
    // TODO: delete after custom services refactor
    const updatedCustomServices = customServices?.map((service) => {
      let price = null

      if (service.fieldName === 'rentPrice') {
        price =
          currentRealEstate?.servicePricePerMeter ??
          currentRealEstate?.customServices?.find(
            (service) => service.fieldName === 'rentPrice'
          )?.price ??
          null
      } else if (service.fieldName === 'cleaningPrice') {
        price =
          currentRealEstate?.cleaning ??
          currentRealEstate?.customServices?.find(
            (service) => service.fieldName === 'cleaningPrice'
          )?.price ??
          null
      } else {
        price = currentRealEstate?.[service.fieldName] ?? null
      }
      return {
        ...service,
        price,
      }
    })
    return updatedCustomServices
  }

  const customServices = customDomainServices?.data?.flatMap((group) =>
    Array.isArray(group?.services)
      ? group?.services?.map((service) => ({
          label: service?.name || 'Невідома послуга',
          price: currentRealEstate?.[service?.fieldName] || null,
          fieldName: service?.fieldName || 'defaultFieldName',
          _id: service?._id || 'defaultId',
        }))
      : []
  )

  const filteredCustomServices = filteredServicesPrice(customServices)
  const noServicesFound = !customDomainServices?.data?.some((group) => Array.isArray(group.services) && group.services.length > 0)

  useEffect(() => {
    const initialValues = {
      domain:
        chosenRealEstate?.domain || currentRealEstate?.domain?.name || domainId,
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
      archived: currentRealEstate?.archived || false,
      rentPart: currentRealEstate?.rentPart || 0,
      inflicion: currentRealEstate?.inflicion || false,
      waterPart: currentRealEstate?.waterPart || 0,
      discount: currentRealEstate?.discount || 0,
      cleaning: currentRealEstate?.cleaning || 0,
      services: currentRealEstate?.services || [],
      customServices:
        (currentRealEstate?.customServices?.length > 0
          ? currentRealEstate.customServices
          : filteredCustomServices) || [],
    }
  const setValues = !form.isFieldsTouched() || currentRealEstate;
  if (setValues) {
    form.setFieldsValue(initialValues);
  }
}, [currentRealEstate, form, filteredCustomServices, domainId, chosenRealEstate]);

  const handleSubmit = async () => {
    const formData: IRealestate = await form.validateFields()

    const realEstateData = {
      domain: currentRealEstate?.domain || formData.domain,
      street: currentRealEstate?.street || formData.street,
      companyName: formData.companyName,
      description: formData.description,
      adminEmails: formData.adminEmails,
      pricePerMeter: formData.pricePerMeter,
      totalArea: formData.totalArea,
      garbageCollector: formData.garbageCollector,
      archived: formData.archived,
      inflicion: formData.inflicion,
      discount:
        formData.discount > 0 ? formData.discount * -1 : formData.discount,
      services: formData.services,
      servicePricePerMeter:
        formData.customServices?.find((c) => c.fieldName === 'rentPrice')
          ?.price ?? formData.servicePricePerMeter,
      rentPart:
        formData.customServices?.find(
          (custom) => custom.fieldName === 'rentPart'
        )?.price ?? formData.rentPart,
      waterPart:
        formData.customServices?.find(
          (custom) => custom.fieldName === 'waterPart'
        )?.price ?? formData.waterPart,
      cleaning:
        formData.customServices?.find(
          (custom) => custom.fieldName === 'cleaningPrice'
        )?.price ?? formData.cleaning,
      customServices: formData.customServices,
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
      changed={() => isValueChanged}
      onCancel={closeModal}
      okText={currentRealEstate ? 'Зберегти' : 'Додати'}
      cancelText={'Відміна'}
      okButtonProps={{ style: { ...(!editable && { display: 'none' }) } }}
      preview={!editable}
    >
      <Tooltip
      title={
        noServicesFound
        ? 'Послуг за даною адресою не знайдено! Будь ласка, оберіть іншу адресу або додайте нову послугу за цією адресою.' : ''
      }
      placement="top"
      >
        <div>
          <RealEstateForm
          form={form}
          currentRealEstate={currentRealEstate}
          editable={editable}
          setIsValueChanged={setIsValueChanged}
          customServices={filteredCustomServices}
          />
          </div>
          </Tooltip>
    </Modal>
  )
}

export default RealEstateModal
