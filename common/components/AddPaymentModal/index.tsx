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
import { Operations, ServiceType } from '@utils/constants'
import useServiceCompanyDomain from '@common/modules/hooks/useServiceCompanyDomain'

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

  /*const { service, company, domain } = useServiceCompanyDomain({
    serviceId: formData.monthService,
    companyId:
  })*/

  const handleSubmit = async () => {
    const formData = await form.validateFields()
    /*const response = await addPayment({
      type: formData.credit ? 'credit' : 'debit',
      date: new Date(),
      domain: formData.domain,
      street: formData.street,
      company: formData.company,
      service: formData.monthService,
      invoice: [
        {
          type: 'electricity',
          lastAmount: formData.electricity.lastAmount,
          amount: formData.electricity.amount,
          price: formData.electricity.price,
          sum: formData.electricity.sum,
        },
        {
          type: 'water',
          lastAmount: formData.water.lastAmount,
          amount: formData.water.amount,
          price: formData.water.price,
          sum: formData.water.sum,
        },
        {
          type: 'placing',
          amount: formData.placing.amount,
          price: formData.placing.price,
          sum: formData.placing.sum,
        },
        {
          type: 'maintenance',
          amount: formData.maintenance.amount,
          price: formData.maintenance.price,
          sum: formData.maintenance.sum,
        },
      ],
    })*/

    const response = {
      type: formData.credit ? Operations.Credit : Operations.Debit,
      date: new Date(),
      domain: formData.domain,
      street: formData.street,
      company: formData.company,
      service: formData.monthService,
      invoice: [
        {
          type: ServiceType.Electricity,
          lastAmount: formData.electricity.lastAmount,
          amount: formData.electricity.amount,
          price: formData.electricity.price,
          sum: formData.electricity.sum,
        },
        {
          type: ServiceType.Water,
          lastAmount: formData.water.lastAmount,
          amount: formData.water.amount,
          price: formData.water.price,
          sum: formData.water.sum,
        },
        {
          type: ServiceType.Placing,
          amount: formData.placing.amount,
          price: formData.placing.price,
          sum: formData.placing.sum,
        },
        {
          type: ServiceType.Maintenance,
          amount: formData.maintenance.amount,
          price: formData.maintenance.price,
          sum: formData.maintenance.sum,
        },
      ],
      from: {},
    }

    //eslint-disable-next-line no-console
    console.log('res: ', response)

    //eslint-disable-next-line no-console
    console.log('formData: ', formData)

    /*if ('data' in response) {
      form.resetFields()
      message.success('Додано')
      closeModal()
    } else {
      message.error('Помилка при додаванні рахунку')
    }*/
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
      style={{ top: 20 }}
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
