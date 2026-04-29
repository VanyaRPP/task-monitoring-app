import {
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
import { defaultServices } from '@utils/constants'
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
  const { data: domains } = useGetDomainsQuery({})
  const { data: user } = useGetCurrentUserQuery()

  useEffect(() => {
    const initialValues = {
      name: currentDomain?.name || '',
      nameForInvoices: currentDomain?.nameForInvoices || '',
      adminEmails: currentDomain?.adminEmails || (user?.email ?  [user.email] : []),
      streets:
        currentDomain?.streets.map((i: any) => ({
          value: i._id,
          label: `${i.address} (м. ${i.city})`,
        })) || [],
      description: currentDomain?.description || '',
      defaultTemplate: currentDomain?.defaultTemplate || null,
      IEName: currentDomain?.IEName || '',
      domainBankToken: currentDomain?.domainBankToken || '',
      mfo: currentDomain?.mfo || '',
      rnokpp: currentDomain?.rnokpp || '',
      iban: currentDomain?.iban || '',
      customServices: currentDomain?.customServices || [
        {
          groupName: 'Стандартні послуги',
          services: defaultServices,
        },
      ],
    }
    form.setFieldsValue(initialValues)
  }, [currentDomain, form, user])

  const handleSubmit = async () => {
    const formData = await form.validateFields()

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

    const domainData = {
      name: formData.name,
      nameForInvoices: formData.nameForInvoices && formData.nameForInvoices.trim() !== ''
        ? formData.nameForInvoices
        : formData.name,
      adminEmails: formData.adminEmails,
      streets: formData.streets.some((i: any) => i.value)
        ? formData.streets.map((i: any) => i.value)
        : formData.streets,
      description: formData.description,
      defaultTemplate: formData.defaultTemplate || undefined,
      IEName: formData.IEName,
      domainBankToken: formData.domainBankToken || [],
      mfo: formData.mfo,
      rnokpp: formData.rnokpp,
      iban: formData.iban,
      customServices: formData.customServices,
    }

    const response = currentDomain
      ? await editDomain({
          _id: currentDomain?._id,
          ...domainData,
        })
      : await addDomainEstate(domainData)

    if ('data' in response) {
      closeModal()
      form.resetFields()
      const action = currentDomain ? 'Збережено' : 'Додано'
      message.success(action)
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