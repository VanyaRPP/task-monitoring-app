import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import useCompany from '@common/modules/hooks/useCompany'
import { Operations, ServiceType } from '@utils/constants'
import {
  convertToInvoicesObject,
  getPaymentProviderAndReciever,
} from '@utils/helpers'
import { Form, Tabs, TabsProps } from 'antd'
import { FormInstance } from 'antd/es/form/Form'
import moment from 'moment'
import { FC, createContext, useContext, useState } from 'react'
import AddPaymentForm from '../Forms/AddPaymentForm'
import ReceiptForm from '../Forms/ReceiptForm'
import Modal from '../UI/ModalWindow'
import s from './style.module.scss'

interface Props {
  closeModal: VoidFunction
  paymentData?: any
  paymentActions?: { edit: boolean; preview: boolean }
}

export const PaymentContext = createContext(
  {} as {
    paymentData: any
    form: FormInstance
  }
)
export const usePaymentContext = () => useContext(PaymentContext)

const AddPaymentModal: FC<Props> = ({
  closeModal,
  paymentData,
  paymentActions,
}) => {
  const [form] = Form.useForm()

  // const [addPayment, { isLoading: isAddingLoading }] = useAddPaymentMutation()
  // const [editPayment, { isLoading: isEditingLoading }] =
  //   useEditPaymentMutation()

  const [currPayment, setCurrPayment] = useState<IExtendedPayment>()
  const { preview, edit } = paymentActions

  const [activeTabKey, setActiveTabKey] = useState(
    getActiveTab(paymentData, preview)
  )
  const companyId = Form.useWatch('company', form)
  const { company } = useCompany({ companyId, skip: !companyId || preview })

  const { provider, reciever } = getPaymentProviderAndReciever(company)

  const handleSubmit = async () => {
    const formData = await form.validateFields()

    console.log(formData)

    // const types = Object.keys(formData.invoice || {})
    // const invoices = types.map((type) => ({
    //   type: type.startsWith(ServiceType.Custom) ? ServiceType.Custom : type,
    //   ...formData?.invoice[type],
    // }))

    // const payment = {
    //   invoiceNumber: formData.invoiceNumber,
    //   type: formData.operation,
    //   domain: formData.domain,
    //   street: formData.street,
    //   company: formData.company,
    //   monthService: formData.monthService,
    //   invoiceCreationDate: formData.invoiceCreationDate,
    //   description: formData.description || '',
    //   generalSum: formData.generalSum || formData.debit,
    //   provider,
    //   reciever,
    //   invoice: formData.debit ? invoices : [],
    // }

    // console.log(payment)

    // const response = edit
    //   ? await editPayment({
    //       _id: paymentData?._id,
    //       ...payment,
    //     })
    //   : await addPayment(payment)

    // if ('data' in response) {
    //   const action = edit ? 'Збережено' : 'Додано'
    //   form.resetFields()
    //   message.success(action)
    //   closeModal()
    // } else {
    //   const action = edit ? 'збереженні' : 'додаванні'
    //   message.error(`Помилка при ${action} рахунку`)
    // }
  }

  const items: TabsProps['items'] = []

  if (!preview) {
    items.push({
      key: '1',
      label: 'Рахунок',
      children: <AddPaymentForm paymentActions={paymentActions} />,
    })
  }

  if (!preview || paymentData?.type === Operations.Debit) {
    items.push({
      key: '2',
      label: 'Перегляд',
      disabled: !preview || !!(paymentData as unknown as any)?.credit,
      children: (
        <ReceiptForm
          currPayment={currPayment}
          paymentData={paymentData}
          paymentActions={paymentActions}
        />
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
        title={edit ? 'Редагування рахунку' : !preview && 'Додавання рахунку'}
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
        changesForm={() => form.isFieldsTouched()}
        onCancel={() => {
          form.resetFields()
          closeModal()
        }}
        okText={edit ? 'Зберегти' : !preview && 'Додати'}
        cancelText={preview ? 'Закрити' : 'Відміна'}
        // confirmLoading={isAddingLoading || isEditingLoading}
        className={s.Modal}
        style={{ top: 20 }}
      >
        <Form
          initialValues={getInitialValues(paymentData)}
          form={form}
          layout="vertical"
          className={s.Form}
        >
          <Tabs
            activeKey={activeTabKey}
            items={items}
            onChange={setActiveTabKey}
          />
        </Form>
      </Modal>
    </PaymentContext.Provider>
  )
}

function getActiveTab(paymentData, edit) {
  if (paymentData?.type === Operations.Credit) return '1'
  return edit ? '2' : '1'
}

function getInitialValues(paymentData) {
  const custom = paymentData?.invoice.filter(
    (item) => item?.type === ServiceType.Custom
  )

  const customFields = custom?.reduce((acc, item) => {
    acc[item.name] = { price: item.price }
    return acc
  }, {})

  const initialValues = {
    domain: paymentData?.domain?._id,
    street: paymentData?.street?._id,
    monthService: paymentData?.monthService?._id,
    company: paymentData?.company?._id,
    description: paymentData?.description,
    credit: paymentData?.credit,
    generalSum: paymentData?.generalSum,
    debit: paymentData?.debit,
    invoiceNumber: paymentData?.invoiceNumber,
    invoiceCreationDate: moment(paymentData?.invoiceCreationDate),
    operation: paymentData ? paymentData.type : Operations.Credit,
    // TODO: remove from here
    // Invoice information should be applied here
    // AddPaymentForm/PaymentPricesTable/index.tsx
    ...convertToInvoicesObject(paymentData?.invoice || []),
    ...customFields,
  }

  return initialValues
}

export default AddPaymentModal
