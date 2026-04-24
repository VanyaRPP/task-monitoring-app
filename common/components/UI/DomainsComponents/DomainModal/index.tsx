import {
  useAddCustomDomainTypeTemplateMutation,
  useAddDomainMutation,
  useEditDomainMutation,
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'
import { Form, message } from 'antd'
import React, { FC, useEffect, useState } from 'react'
import {
  IExtendedDomain,
} from '@common/api/domainApi/domain.api.types'
import DomainForm from './DomainForm'
import Modal from '../../ModalWindow'
import {
  normalizeDomainServiceKind,
  presetGroupsToFormValues,
} from '@utils/domain/domain-service-policy'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'

interface Props {
  currentDomain: IExtendedDomain
  closeModal: VoidFunction
  editable: boolean
}

const DomainModal: FC<Props> = ({ currentDomain, closeModal, editable }) => {
  const [form] = Form.useForm()
  const [isValueChanged, setIsValueChanged] = useState(false)
  const [addDomainEstate, { isLoading: isAdding }] = useAddDomainMutation()
  const [editDomain, { isLoading: isEditing }] = useEditDomainMutation()
  const [publishTypeTemplate] = useAddCustomDomainTypeTemplateMutation()
  const { data: domains } = useGetDomainsQuery({})
  const { data: user } = useGetCurrentUserQuery()

  useEffect(() => {
    const domainType = currentDomain?.domainType || 'communal'
    const customServices = currentDomain?.customServices?.length
      ? currentDomain.customServices
      : presetGroupsToFormValues(normalizeDomainServiceKind(domainType))

    const initialValues = {
      name: currentDomain?.name || '',
      adminEmails: currentDomain?.adminEmails || (user?.email ?  [user.email] : []),
      streets:
        currentDomain?.streets.map((i: any) => ({
          value: i._id,
          label: `${i.address} (м. ${i.city})`,
        })) || [],
      description: currentDomain?.description || '',
      IEName: currentDomain?.IEName || '',
      domainBankToken: currentDomain?.domainBankToken || '',
      mfo: currentDomain?.mfo || '',
      rnokpp: currentDomain?.rnokpp || '',
      iban: currentDomain?.iban || '',
      domainType,
      customDomainTypeLabel:
        currentDomain?.customDomainTypeLabel ??
        (domainType === 'own'
          ? currentDomain?.ownServiceName ?? ''
          : ''),
      customServiceGroupName:
        currentDomain?.customServiceGroupName ??
        (domainType === 'own'
          ? currentDomain?.customServices?.[0]?.groupName ?? ''
          : ''),
      ownServiceValue: currentDomain?.ownServiceValue || '',
      publishCustomTypeTemplate: false,
      customServices,
    }
    form.setFieldsValue(initialValues)
  }, [currentDomain, form, user])

  const handleSubmit = async () => {
    await form.validateFields()
    const formData = form.getFieldsValue()

    if (
      !currentDomain &&
      domains?.some((domain) => domain.name === formData.name)
    ) {
      message.error({
        content:
          'Помилка при додаванні надавача послуг!  Домен з такою назвою вже існує!',
        duration: 4,
        style: {
          marginTop: '20vh',
          fontSize: '2rem',
          zIndex: 9999,
        },
      })
      return
    }

    const isOwn = formData.domainType === 'own'
    const typeLabel = formData.customDomainTypeLabel?.trim() ?? ''
    const groupLabel = formData.customServiceGroupName?.trim() ?? ''

    const domainData = {
      name: formData.name,
      adminEmails: formData.adminEmails,
      streets: formData.streets.some((i: any) => i.value)
        ? formData.streets.map((i: any) => i.value)
        : formData.streets,
      description: formData.description,
      IEName: formData.IEName,
      domainBankToken: formData.domainBankToken || [],
      mfo: formData.mfo,
      rnokpp: formData.rnokpp,
      iban: formData.iban,
      customServices: formData.customServices,
      domainType: formData.domainType,
      customDomainTypeLabel: isOwn ? typeLabel : '',
      customServiceGroupName: isOwn ? groupLabel : '',
      ownServiceName: isOwn ? typeLabel : '',
      ownServiceValue: formData.ownServiceValue,
    }

    const response = currentDomain
      ? await editDomain({
          _id: currentDomain?._id,
          ...domainData,
        })
      : await addDomainEstate(domainData)

    if ('data' in response) {
      let templatePublished = false
      let templateError: string | undefined
      if (
        formData.publishCustomTypeTemplate &&
        isOwn &&
        typeLabel &&
        groupLabel
      ) {
        try {
          await publishTypeTemplate({
            typeLabel,
            groupName: groupLabel,
          }).unwrap()
          templatePublished = true
        } catch (e) {
          console.error('publishTypeTemplate failed', e)
          templateError =
            'Шаблон не додано (можливо вже є в списку).'
        }
      }
      closeModal()
      form.resetFields()
      const action = currentDomain ? 'Збережено' : 'Додано'
      if (templateError) {
        message.warning(`${action}. ${templateError}`)
      } else if (templatePublished) {
        message.success(`${action}. Шаблон доступний іншим адмінам.`)
      } else {
        message.success(action)
      }
    } else {
      const action = currentDomain ? 'збереженні' : 'додаванні'
      message.error(`Помилка при ${action} надавача послуг`)
    }
  }

  return (
    <Modal
      open={true}
      title={'Надавачі послуг'}
      onOk={handleSubmit}
      changed={() => isValueChanged}
      onCancel={closeModal}
      okText={currentDomain ? 'Зберегти' : 'Додати'}
      cancelText={'Відміна'}
      okButtonProps={{ style: { ...(!editable && { display: 'none' }) } }}
      preview={!editable}
      confirmLoading={isAdding || isEditing}
    >
      <DomainForm
        form={form}
        editable={editable}
        setIsValueChanged={setIsValueChanged}
        domainId={currentDomain?._id}
      />
    </Modal>
  )
}

export default DomainModal