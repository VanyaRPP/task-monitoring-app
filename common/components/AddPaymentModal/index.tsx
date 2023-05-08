/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useAddPaymentMutation } from '@common/api/paymentApi/payment.api'
import {
  IExtendedPayment,
  IPayment,
} from '@common/api/paymentApi/payment.api.types'
import { Form, message, Modal, Tabs, TabsProps } from 'antd'
import React, { FC, useState } from 'react'
import AddPaymentForm from '../Forms/AddPaymentForm'
import ReceiptForm from '../Forms/ReceiptForm'
import s from './style.module.scss'
import { Operations } from '@utils/constants'

interface Props {
  closeModal: VoidFunction
  paymentData?: object
  edit?: boolean
}

const AddPaymentModal: FC<Props> = ({ closeModal, paymentData, edit }) => {
  const [form] = Form.useForm()
  const [addPayment, { isLoading }] = useAddPaymentMutation()
  const [currPayment, setCurrPayment] = useState<IExtendedPayment>()

  const [activeTabKey, setActiveTabKey] = useState(
    getActiveTab(paymentData, edit)
  )

  const handleSubmit = async () => {
    const formData: IPayment = await form.validateFields()
    const response = await addPayment({
      payer: formData.payer,
      credit: formData.credit,
      description: formData.description,
      maintenance: formData.maintenance,
      placing: formData.placing,
      electricity: formData.electricity,
      water: formData.water,
      debit: formData.debit,
    })
    if ('data' in response) {
      form.resetFields()
      message.success('Додано')
      closeModal()
    } else {
      message.error('Помилка при додаванні рахунку')
    }
  }

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: 'Рахунок',
      children: (
        <AddPaymentForm form={form} edit={edit} paymentData={paymentData} />
      ),
    },
    {
      key: '2',
      label: 'Перегляд',
      // @ts-ignore
      disabled: !edit || !!paymentData?.credit,
      children: (
        <ReceiptForm currPayment={currPayment} paymentData={paymentData} />
      ),
    },
  ]

  return (
    <Modal
      open={true}
      maskClosable={false}
      title={!edit && 'Додавання рахунку'}
      onOk={
        activeTabKey === '1'
          ? () => {
              form.validateFields().then((values) => {
                if (values.operation === Operations.Credit) {
                  handleSubmit()
                } else {
                  setCurrPayment(values)
                  setActiveTabKey('2')
                }
              })
            }
          : handleSubmit
      }
      onCancel={() => {
        form.resetFields()
        closeModal()
      }}
      okText={!edit && 'Додати'}
      cancelText={edit ? 'Закрити' : 'Відміна'}
      confirmLoading={isLoading}
      className={s.Modal}
    >
      <Tabs activeKey={activeTabKey} items={items} onChange={setActiveTabKey} />
    </Modal>
  )
}

function getActiveTab(paymentData, edit) {
  if (paymentData?.credit) return '1'
  return edit ? '2' : '1'
}

export default AddPaymentModal
