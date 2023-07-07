import {
  useAddPaymentMutation,
  useGetPaymentsCountQuery,
} from '@common/api/paymentApi/payment.api'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { Form, message, Modal, Tabs, TabsProps } from 'antd'
import React, { FC, createContext, useContext, useState } from 'react'
import AddPaymentForm from '../Forms/AddPaymentForm'
import ReceiptForm from '../Forms/ReceiptForm'
import s from './style.module.scss'
import { Operations, ServiceType } from '@utils/constants'
import { FormInstance } from 'antd/es/form/Form'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'

interface Props {
  closeModal: VoidFunction
  paymentData?: object
  edit?: boolean
}

export const PaymentContext = createContext(
  {} as {
    paymentData: any
    form: FormInstance
  }
)
export const usePaymentContext = () => useContext(PaymentContext)

const AddPaymentModal: FC<Props> = ({ closeModal, paymentData, edit }) => {
  const [form] = Form.useForm()
  const [addPayment, { isLoading }] = useAddPaymentMutation()
  const [currPayment, setCurrPayment] = useState<IExtendedPayment>()
  const { data: count = 0 } = useGetPaymentsCountQuery({ skip: edit })
  const { data: realEstate } = useGetAllRealEstateQuery(
    { domainId: currPayment?.domain, streetId: currPayment?.street },
    { skip: edit }
  )

  const [activeTabKey, setActiveTabKey] = useState(
    getActiveTab(paymentData, edit)
  )

  // TODO: fill it
  const provider = realEstate?.length
    ? {
        name: realEstate[0]?.domain?.name,
        address: realEstate[0]?.domain?.address,
        bankInformation: realEstate[0]?.domain?.bankInformation,
      }
    : {}

  const reciever = realEstate?.length
    ? {
        companyName: realEstate[0]?.companyName,
        adminEmails: realEstate[0]?.adminEmails,
        phone: realEstate[0]?.phone,
      }
    : {}

  const handleSubmit = async () => {
    const formData = await form.validateFields()

    const response = await addPayment({
      invoiceNumber: count + 1,
      type: formData.credit ? Operations.Credit : Operations.Debit,
      date: new Date(),
      domain: formData.domain,
      street: formData.street,
      company: formData.company,
      monthService: formData.monthService,
      description: formData.description ? formData.description : '',
      generalSum: formData.credit
        ? formData.credit
        : formData.maintenancePrice.sum +
          formData.placingPrice.sum +
          formData.electricityPrice.sum +
        formData.waterPrice.sum,
      // TODO: fix
      provider,
      reciever,
      invoice: formData.debit
        ? [
            {
              type: ServiceType.Maintenance,
              amount: formData.maintenancePrice.amount,
              price: formData.maintenancePrice.price,
              sum: formData.maintenancePrice.sum,
            },
            {
              type: ServiceType.Placing,
              amount: formData.placingPrice.amount,
              price: formData.placingPrice.price,
              sum: formData.placingPrice.sum,
            },
            {
              type: ServiceType.Electricity,
              lastAmount: formData.electricityPrice.lastAmount,
              amount: formData.electricityPrice.amount,
              price: formData.electricityPrice.price,
              sum: formData.electricityPrice.sum,
            },
            {
              type: ServiceType.Water,
              lastAmount: formData.waterPrice.lastAmount,
              amount: formData.waterPrice.amount,
              price: formData.waterPrice.price,
              sum: formData.waterPrice.sum,
            },
          ]
        : [],
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
      disabled: !edit || !!(paymentData as unknown as any)?.credit,
      children: (
        <ReceiptForm currPayment={currPayment} paymentData={paymentData} />
      ),
    },
  ]

  return (
    <PaymentContext.Provider
      value={{
        paymentData,
        form,
      }}
    >
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
                    setCurrPayment({ ...values, provider, reciever })
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
        <Tabs
          activeKey={activeTabKey}
          items={items}
          onChange={setActiveTabKey}
        />
      </Modal>
    </PaymentContext.Provider>
  )
}

function getActiveTab(paymentData, edit) {
  if (paymentData?.credit) return '1'
  return edit ? '2' : '1'
}

export default AddPaymentModal
