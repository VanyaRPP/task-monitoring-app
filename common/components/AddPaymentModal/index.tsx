import { useAddPaymentMutation } from '@common/api/paymentApi/payment.api'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { Form, message, Modal, Tabs, TabsProps } from 'antd'
import React, { FC, createContext, useContext, useState } from 'react'
import AddPaymentForm from '../Forms/AddPaymentForm'
import ReceiptForm from '../Forms/ReceiptForm'
import s from './style.module.scss'
import { Operations } from '@utils/constants'
import { FormInstance } from 'antd/es/form/Form'
import {
  filterInvoiceObject,
  getPaymentProviderAndReciever,
} from '@utils/helpers'
import useCompany from '@common/modules/hooks/useCompany'

interface Props {
  closeModal: VoidFunction
  paymentData?: any
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

  const [activeTabKey, setActiveTabKey] = useState(
    getActiveTab(paymentData, edit)
  )
  const companyId = Form.useWatch('company', form)
  const { company } = useCompany({ companyId, skip: !companyId || edit })

  const { provider, reciever } = getPaymentProviderAndReciever(company)

  const handleSubmit = async () => {
    const formData = await form.validateFields()
    const filteredInvoice = filterInvoiceObject(formData)
    const response = await addPayment({
      invoiceNumber: formData.invoiceNumber,
      type: formData.credit ? Operations.Credit : Operations.Debit,
      domain: formData.domain,
      street: formData.street,
      company: formData.company,
      monthService: formData.monthService,
      invoiceCreationDate: formData.invoiceCreationDate,
      description: formData.description || '',
      generalSum: filteredInvoice?.reduce((acc, val) => acc + val.sum, 0) || 0,
      provider,
      reciever,
      invoice: formData.debit ? filteredInvoice : [],
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
  ]

  if (!edit || paymentData?.type === Operations.Debit) {
    items.push({
      key: '2',
      label: 'Перегляд',
      disabled: !edit || !!(paymentData as unknown as any)?.credit,
      children: (
        <ReceiptForm currPayment={currPayment} paymentData={paymentData} />
      ),
    })
  }

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
  if (paymentData?.type === Operations.Credit) return '1'
  return edit ? '2' : '1'
}

export default AddPaymentModal
