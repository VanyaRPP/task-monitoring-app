import {
  useAddRealEstateMutation,
  useEditRealEstateMutation,
} from '@common/api/realestateApi/realestate.api'
import React, { FC, useEffect, useState, useRef, useMemo } from 'react'
import {
  IExtendedRealestate,
  IRealestate,
} from '@common/api/realestateApi/realestate.api.types'
import { Form, message } from 'antd'
import Modal from '../../ModalWindow'
import RealEstateForm from './RealEstateForm'
import { IDomain } from '@modules/models/Domain'
import {
  useGetCustomServicesQuery,
  useGetCustomServicesByDomainQuery,
} from '@common/api/customServicesApi/customServices.api'

const getEntityId = (value?: { _id?: string } | string) => {
  if (!value) return ''
  return typeof value === 'string' ? value : value._id || ''
}

interface Props {
  chosenRealEstate: { domain: string; street?: string } | null
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
  const initializedRef = useRef(false)
  const [addRealEstate, { isLoading: isAdding }] = useAddRealEstateMutation()
  const [editRealEstate, { isLoading: isEditing }] = useEditRealEstateMutation()
  const domainId = Form.useWatch('domain', form)
  const currentDomainId =
    getEntityId(currentRealEstate?.domain) ||
    domainId ||
    chosenRealEstate?.domain
  const { data: customDomainServices } = useGetCustomServicesByDomainQuery(
    { domainId: currentDomainId },
    { skip: !currentDomainId }
  )

  const domainCustomServices = useMemo(() => {
    return (
      customDomainServices?.data?.flatMap((group) =>
        Array.isArray(group?.services)
          ? group.services.map((s) => ({
              _id: s._id,
              label: s.name,
              fieldName: s.fieldName,
              price: 0,
            }))
          : []
      ) || []
    )
  }, [customDomainServices])

  const mergedCustomServices = useMemo(() => {
    // Saved entries take precedence (preserve user prices), but only if the
    // service still exists in the domain catalog (orphans get dropped).
    // New domain services that the company hasn't seen yet are appended with
    // price 0 so they show up immediately after a domain admin adds them.
    const saved = currentRealEstate?.customServices || []
    const validSaved = saved.filter((s) =>
      domainCustomServices.some((d) => d._id === s._id)
    )
    const newFromDomain = domainCustomServices.filter(
      (d) => !validSaved.some((s) => s._id === d._id)
    )
    return [...validSaved, ...newFromDomain]
  }, [currentRealEstate, domainCustomServices])

  useEffect(() => {
    if (initializedRef.current) return
    if (!currentDomainId) return
    // Wait for domain custom services query to resolve before initializing
    // form state, otherwise the merge above runs against an empty list and
    // initializedRef locks it in.
    if (customDomainServices === undefined) return

    form.setFieldsValue({
      domain:
        chosenRealEstate?.domain ||
        getEntityId(currentRealEstate?.domain) ||
        currentDomainId,
      street:
        currentRealEstate?.street &&
        `${currentRealEstate.street.address} (м. ${currentRealEstate.street.city})`,
      companyName: currentRealEstate?.companyName || '',
      description: currentRealEstate?.description || '',
      adminEmails: currentRealEstate?.adminEmails || [],
      pricePerMeter: currentRealEstate?.pricePerMeter || 0,
      servicePricePerMeter: currentRealEstate?.servicePricePerMeter || 0,
      totalArea: currentRealEstate?.totalArea || 0,
      currency: currentRealEstate?.currency || 'UAH',
      garbageCollector: currentRealEstate?.garbageCollector || false,
      archived: currentRealEstate?.archived || false,
      account: currentRealEstate?.account || '',
      rentPart: currentRealEstate?.rentPart || 0,
      inflicion: currentRealEstate?.inflicion || false,
      waterPart: currentRealEstate?.waterPart || 0,
      discount: currentRealEstate?.discount || 0,
      cleaning: currentRealEstate?.cleaning || 0,
      services: currentRealEstate?.services || [],
      customServices: mergedCustomServices,
    })

    initializedRef.current = true
  }, [
    currentDomainId,
    chosenRealEstate?.domain,
    currentRealEstate,
    form,
    customDomainServices,
    mergedCustomServices,
  ])

  const handleSubmit = async () => {
    const formData: IRealestate = await form.validateFields()

    const filteredCustomServices =
      formData.customServices?.filter(
        (s) => typeof s.price === 'number' && s.price >= 0
      ) || []

    const realEstateData = {
      domain: getEntityId(formData.domain),
      street:
        getEntityId(formData.street) ||
        getEntityId(currentRealEstate?.street) ||
        undefined,
      companyName: formData.companyName,
      description: formData.description,
      adminEmails: formData.adminEmails,
      pricePerMeter: formData.pricePerMeter,
      totalArea: formData.totalArea,
      currency: formData.currency,
      garbageCollector: formData.garbageCollector,
      archived: formData.archived,
      account: formData.account,
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
      customServices: filteredCustomServices,
    }

    const response = currentRealEstate
      ? await editRealEstate({
          _id: currentRealEstate?._id,
          ...realEstateData,
        } as any)
      : await addRealEstate(realEstateData as any)

    if ('data' in response) {
      form.resetFields()
      closeModal()
      const action = currentRealEstate ? 'Збережено' : 'Додано'
      message.success(action)
    } else {
      const action = currentRealEstate ? 'збереженні' : 'додаванні'
      // Surface the server's reason so the failure is diagnosable instead of a
      // generic toast (e.g. "Domain is required", validation errors, etc.).
      const errData = (response as { error?: { data?: { message?: unknown } } })
        ?.error?.data
      const serverMsg =
        typeof errData?.message === 'string'
          ? errData.message
          : errData?.message
            ? JSON.stringify(errData.message)
            : undefined
      console.error('addRealEstate failed:', response)
      message.error(
        serverMsg
          ? `Помилка при ${action}: ${serverMsg}`
          : `Помилка при ${action}`
      )
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
      confirmLoading={isAdding || isEditing}
    >
      <RealEstateForm
        form={form}
        currentRealEstate={currentRealEstate}
        editable={editable}
        setIsValueChanged={setIsValueChanged}
        customServices={domainCustomServices}
        preselectedStreet={chosenRealEstate?.street}
      />
    </Modal>
  )
}

export default RealEstateModal
