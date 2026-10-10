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
  /**
   * A NEW company filled in ahead of time (an AI draft): prefills the form
   * like `currentRealEstate` but saving creates it. Domain and address come
   * through `chosenRealEstate`, as when adding from a domain's page.
   */
  draft?: Partial<IRealestate>
  editable?: boolean
}

const RealEstateModal: FC<Props> = ({
  chosenRealEstate,
  closeModal,
  currentRealEstate,
  draft,
  editable,
}) => {
  const [form] = Form.useForm()
  // What the fields start from: the company being edited, or a draft.
  const source = (currentRealEstate ?? draft) as
    Partial<IExtendedRealestate> | undefined
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
              // Тег типу потрібен формі, щоб зрозуміти, чи є в домені послуга
              // «за площею» (див. isMeterBasedServiceExist). У БД не потрапляє:
              // схема RealEstate.customServices його не містить.
              serviceType: (s as { serviceType?: string }).serviceType,
              price: undefined,
            }))
          : []
      ) || []
    )
  }, [customDomainServices])

  const mergedCustomServices = useMemo(() => {
    const saved = source?.customServices || []
    return saved.filter((s) =>
      domainCustomServices.some((d) => d._id === s._id)
    )
  }, [source, domainCustomServices])

  useEffect(() => {
    if (!currentDomainId) return
    if (customDomainServices === undefined) return

    const targetId = currentRealEstate?._id ?? null
    if (initializedForRef.current === targetId) return

    form.setFieldsValue({
      domain: currentRealEstate
        ? getEntityId(currentRealEstate?.domain)
        : chosenRealEstate?.domain || currentDomainId,
      street: getEntityId(source?.street),
      companyName: source?.companyName || '',
      description: source?.description || '',
      adminEmails: source?.adminEmails || [],
      pricePerMeter: source?.pricePerMeter || 0,
      servicePricePerMeter: source?.servicePricePerMeter || 0,
      totalArea: source?.totalArea || 0,
      currency: source?.currency || 'UAH',
      garbageCollector: source?.garbageCollector || false,
      archived: source?.archived || false,
      account: source?.account || '',
      contractNumber: source?.contractNumber || '',
      // DatePicker expects a dayjs instance, not the raw ISO string from the API.
      contractDate: source?.contractDate
        ? dayjs(source.contractDate)
        : undefined,
      rentPart: source?.rentPart || 0,
      inflicion: source?.inflicion || false,
      waterPart: source?.waterPart || 0,
      discount: source?.discount || 0,
      cleaning: source?.cleaning || 0,
      services: source?.services || [],
      customServices: source ? mergedCustomServices : [],
      allServices: source?.allServices ?? false,
    })

    initializedForRef.current = targetId
  }, [
    currentDomainId,
    chosenRealEstate?.domain,
    currentRealEstate,
    source,
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
