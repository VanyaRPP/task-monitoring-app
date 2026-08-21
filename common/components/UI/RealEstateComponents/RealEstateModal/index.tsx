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
import dayjs from 'dayjs'
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
  // Tracks which entity the form was last populated for, so the form
  // re-syncs whenever the edited/added entity actually changes instead of
  // only once per mount (a stale one-shot guard was the source of a bug
  // where switching entities without unmounting kept showing old values).
  const initializedForRef = useRef<string | null | undefined>(undefined)
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
              price: undefined,
            }))
          : []
      ) || []
    )
  }, [customDomainServices])

  const mergedCustomServices = useMemo(() => {
    const saved = currentRealEstate?.customServices || []
    return saved.filter((s) =>
      domainCustomServices.some((d) => d._id === s._id)
    )
  }, [currentRealEstate, domainCustomServices])

  useEffect(() => {
    if (!currentDomainId) return
    if (customDomainServices === undefined) return

    const targetId = currentRealEstate?._id ?? null
    if (initializedForRef.current === targetId) return

    form.setFieldsValue({
      domain:
        chosenRealEstate?.domain ||
        getEntityId(currentRealEstate?.domain) ||
        currentDomainId,
      street: getEntityId(currentRealEstate?.street),
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
      contractNumber: currentRealEstate?.contractNumber || '',
      // DatePicker expects a dayjs instance, not the raw ISO string from the API.
      contractDate: currentRealEstate?.contractDate
        ? dayjs(currentRealEstate.contractDate)
        : undefined,
      rentPart: currentRealEstate?.rentPart || 0,
      inflicion: currentRealEstate?.inflicion || false,
      waterPart: currentRealEstate?.waterPart || 0,
      discount: currentRealEstate?.discount || 0,
      cleaning: currentRealEstate?.cleaning || 0,
      services: currentRealEstate?.services || [],
      customServices: currentRealEstate ? mergedCustomServices : [],
      allServices: currentRealEstate?.allServices ?? false,
    })

    initializedForRef.current = targetId
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
      contractNumber: formData.contractNumber,
      contractDate: formData.contractDate
        ? dayjs(formData.contractDate).toISOString()
        : undefined,
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
      allServices: form.getFieldValue('allServices') ?? false,
    }

    const response = currentRealEstate
      ? await editRealEstate({
          _id: currentRealEstate?._id,
          ...realEstateData,
        } as any)
      : await addRealEstate(realEstateData as any)

    if ('data' in response) {
      form.resetFields()
      initializedForRef.current = undefined
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

  const handleCancel = () => {
    // Defensive reset so the form never carries stale values into a future
    // open, even if this modal is ever mounted without being fully
    // unmounted/remounted by its parent between opens.
    form.resetFields()
    initializedForRef.current = undefined
    closeModal()
  }

  return (
    <Modal
      style={{ top: 20 }}
      title={'Компанії'}
      onOk={handleSubmit}
      changed={() => isValueChanged}
      onCancel={handleCancel}
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
