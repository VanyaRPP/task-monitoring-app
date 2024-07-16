import {
  useAddDomainMutation,
  useEditDomainMutation,
} from '@common/api/domainApi/domain.api'
import { Form, message } from 'antd'
import React, { FC, useEffect } from 'react'
import {
  IDomainModel,
  IExtendedDomain,
} from '@common/api/domainApi/domain.api.types'
import DomainForm from './DomainForm'
import Modal from '../../ModalWindow'

interface Props {
  currentDomain: IExtendedDomain
  closeModal: VoidFunction
  editable: boolean
}

const DomainModal: FC<Props> = ({ currentDomain, closeModal, editable }) => {
  const [form] = Form.useForm()
  const [addDomainEstate] = useAddDomainMutation()
  const [editDomain] = useEditDomainMutation()

  useEffect(() => {
    const initialValues = {
      name: currentDomain?.name || '',
      adminEmails: currentDomain?.adminEmails || [],
      streets: currentDomain?.streets.map((i: any) => ({
        value: i._id,
        label: `${i.address} (м. ${i.city})`,
      })) || [],
      description: currentDomain?.description || '',
    }
    form.setFieldsValue(initialValues)
  }, [currentDomain, form])

  const handleSubmit = async () => {
    const formData: IDomainModel = await form.validateFields()

    const domainData = {
      name: formData.name,
      adminEmails: formData.adminEmails,
      streets: formData.streets.some((i: any) => i.value)
        ? formData.streets.map((i: any) => i.value)
        : formData.streets,
      description: formData.description,
    }

    const response = currentDomain
      ? await editDomain({
          _id: currentDomain?._id,
          ...domainData,
        })
      : await addDomainEstate(domainData)

    if ('data' in response) {
      form.resetFields()
      closeModal()
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
      changesForm={() => form.isFieldsTouched()}
      onCancel={closeModal}
      okText={currentDomain ? 'Зберегти' : 'Додати'}
      cancelText={'Відміна'}
      okButtonProps={{ style: { display: !editable ? 'none' : 'inline' } }}
      preview={!editable}
    >
      <DomainForm form={form} editable={editable} />
    </Modal>
  )
}

export default DomainModal
