import {
  useAddDomainMutation,
  useEditDomainMutation,
} from '@common/api/domainApi/domain.api'
import { Form, message } from 'antd'
import React,  { FC } from 'react'
import {
  IDomainModel,
  IExtendedDomain,
} from '@common/api/domainApi/domain.api.types'
import DomainForm from './DomainForm'
import Modal from '../../ModalWindow'
import { set } from 'lodash'

interface Props {
  currentDomain: IExtendedDomain
  closeModal: VoidFunction
}

const DomainModal: FC<Props> = ({ currentDomain, closeModal }) => {
  const [form] = Form.useForm()
  let errorType = ('')
  const [addDomainEstate] = useAddDomainMutation()
  const [editDomain] = useEditDomainMutation()

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

    if(!domainData.streets.some((i: any) => i.value))
      errorType = 'adress'
    // else if
    else 
      errorType = ''

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
      if(errorType === 'adress') 
        message.error(`Адреса не знайдена`)
      // else if
      else 
        message.error(`Помилка при ${action} надавача послуг`)
    }
  }

  return (
    <Modal
      open={true}
      title={'Надавачі послуг'}
      onOk={handleSubmit}
      onCancel={closeModal}
      okText={currentDomain ? 'Зберегти' : 'Додати'}
      cancelText={'Відміна'}
    >
      <DomainForm form={form} currentDomain={currentDomain} />
    </Modal>
  )
}

export default DomainModal
