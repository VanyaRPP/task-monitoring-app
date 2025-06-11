import {
  useAddDomainMutation,
  useEditDomainMutation,
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'
import { Form, message } from 'antd'
import React, { FC, useEffect, useState } from 'react'
import {
  IDomainModel,
  IExtendedDomain,
} from '@common/api/domainApi/domain.api.types'
import DomainForm from './DomainForm'
import Modal from '../../ModalWindow'
import { current } from '@reduxjs/toolkit'

interface Props {
  currentDomain: IExtendedDomain
  closeModal: VoidFunction
  editable: boolean
}

const DomainModal: FC<Props> = ({ currentDomain, closeModal, editable }) => {
  const [form] = Form.useForm()
  const [isValueChanged, setIsValueChanged] = useState(false)
  const [addDomainEstate] = useAddDomainMutation()
  const [editDomain] = useEditDomainMutation()
  const { data: domains } = useGetDomainsQuery({})

  useEffect(() => {
    const initialValues = {
      name: currentDomain?.name || '',
      adminEmails: currentDomain?.adminEmails || [],
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
      customServices: currentDomain?.customServices || [
        {
          groupName: 'Стандартні послуги',
          services: [
            '677d414283b6ef93c6b8ea2c',
            '68156d2cf520914e5e1ad87c',
            '68156cdbf520914e5e1ad877',
            '6816bca1e26e39a785fd7a0d',
            '68156d58f520914e5e1ad881',
            '677d434c83b6ef93c6b8ea3a',
            '68230f76a51fddf0ae165d77',
            '682dd48d9665126611c81950',
          ],
        },
      ],
    }
    form.setFieldsValue(initialValues)
  }, [currentDomain, form])

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
