import {
  useAddPaymentMutation,
  useEditPaymentMutation,
} from '@common/api/paymentApi/payment.api'
import {
  IExtendedPayment,
  IPayment,
} from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { Invoice } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable'
import { usePaymentData } from '@common/modules/hooks/usePaymentData'
import { Operations, ServiceType } from '@utils/constants'
import { getPaymentProviderAndReciever } from '@utils/helpers'
import { Form, Tabs, TabsProps, message } from 'antd'
import { FormInstance } from 'antd/es/form/Form'
import moment from 'moment'
import { FC, createContext, useContext, useEffect, useState } from 'react'
import AddPaymentForm from '../Forms/AddPaymentForm'
import ReceiptForm from '../Forms/ReceiptForm'
import Modal from '../UI/ModalWindow'
import s from './style.module.scss'

interface Props {
  closeModal: VoidFunction
  paymentData?: any
  paymentActions?: { edit: boolean; preview: boolean }
}

export interface IPaymentContext {
  payment: IPayment
  prevPayment: IPayment
  service: IService
  prevService: IService
  company: IRealestate
  form: FormInstance
}

export const PaymentContext = createContext<IPaymentContext>({
  payment: null,
  prevPayment: null,
  service: null,
  prevService: null,
  company: null,
  form: null,
})
export const usePaymentContext = () =>
  useContext<IPaymentContext>(PaymentContext)

const AddPaymentModal: FC<Props> = ({
  closeModal,
  paymentData,
  paymentActions,
}) => {
  const [form] = Form.useForm()

  const { company, service, prevService, payment, prevPayment } =
    usePaymentData({ form, paymentData })

  const [addPayment, { isLoading: isAddingLoading }] = useAddPaymentMutation()
  const [editPayment, { isLoading: isEditingLoading }] =
    useEditPaymentMutation()

  const [currPayment, setCurrPayment] = useState<IExtendedPayment>()
  const { preview, edit } = paymentActions

  const [activeTabKey, setActiveTabKey] = useState(
    getActiveTab(paymentData, preview)
  )

  const { provider, reciever } = getPaymentProviderAndReciever(company)

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (values.operation === Operations.Credit) {
        handleSubmit()
      } else {
        setCurrPayment({ ...values, provider, reciever })
        setActiveTabKey('2')
      }
    })
  }

  const handleSubmit = async () => {
    const formData = await form.validateFields()

    const payment = {
      invoiceNumber: formData.invoiceNumber,
      type: formData.operation,
      domain: formData.domain,
      street: formData.street,
      company: formData.company,
      monthService: formData.monthService,
      invoiceCreationDate: formData.invoiceCreationDate,
      description: formData.description || '',
      generalSum: formData.generalSum || formData.debit,
      provider,
      reciever,
      invoice: formData.debit ? formData.invoice : [],
    }

    const response = edit
      ? await editPayment({
          _id: paymentData?._id,
          ...payment,
        })
      : await addPayment(payment)

    if ('data' in response) {
      const action = edit ? 'Збережено' : 'Додано'
      form.resetFields()
      message.success(action)
      closeModal()
    } else {
      const action = edit ? 'збереженні' : 'додаванні'
      message.error(`Помилка при ${action} рахунку`)
    }
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

  useEffect(() => {
    form.setFieldsValue({
      invoice: getInvoices({ company, service, payment, prevPayment }),
    })
  }, [form, company, payment, prevPayment, service])

  return (
    <PaymentContext.Provider
      value={{
        company,
        service,
        prevService,
        payment,
        prevPayment,
        form,
      }}
    >
      <Modal
        title={edit ? 'Редагування рахунку' : !preview && 'Додавання рахунку'}
        onOk={activeTabKey === '1' ? handleOk : handleSubmit}
        changesForm={() => form.isFieldsTouched()}
        onCancel={() => {
          form.resetFields()
          closeModal()
        }}
        okText={edit ? 'Зберегти' : !preview && 'Додати'}
        cancelText={preview ? 'Закрити' : 'Відміна'}
        confirmLoading={isAddingLoading || isEditingLoading}
        className={s.Modal}
        style={{ top: 20 }}
      >
        <Form
          initialValues={{
            // TODO: fix payment typing globally to not be `domain: Partial<IDomain> | string` but `Partial<IDomain>` instead
            // esling-disable-next-line
            // @ts-ignore
            domain: payment?.domain?._id,
            // TODO: fix payment typing globally to not be `domain: Partial<IStreet> | string` but `Partial<IStreet>` instead
            // esling-disable-next-line
            // @ts-ignore
            street: payment?.street?._id,
            // TODO: fix payment typing globally to not be `domain: Partial<IService> | string` but `Partial<IService>` instead
            // esling-disable-next-line
            // @ts-ignore
            monthService: payment?.monthService?._id,
            // TODO: fix payment typing globally to not be `domain: Partial<IRealestate> | string` but `Partial<IRealestate>` instead
            // TODO: ???rename IRealestate to ICompany maybe, what the realestate means actually???
            // esling-disable-next-line
            // @ts-ignore
            company: payment?.company?._id,
            description: payment?.description,
            generalSum: payment?.generalSum,
            invoiceNumber: payment?.invoiceNumber,
            // TODO: new Date() instead of moment() - now cause "date.clone is not a function"
            invoiceCreationDate: moment(payment?.invoiceCreationDate),
            operation: payment?.type || Operations.Credit,
          }}
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

const getInvoices = ({ company, service, payment, prevPayment }) => {
  if (payment) {
    return getPaymentInvoices(payment)
  }

  if (service && company) {
    return getCompanyAndServiceInvoices(company, prevPayment, service)
  }

  return []
}

const getPaymentInvoices = (payment) => {
  return payment.invoice.map((invoice) => ({
    ...invoice,
    name: invoice.name || invoice.type,
  }))
}

/**
 * maybe move all calculations to components directly and leave only condition of invoices to be displayed?
 * @example
 * if (company?.pricePerMeter && company?.rentPart) {
 *   invoices.push({ type: ServiceType.Maintenance })
 * } // price, sum, etc should be calculated in individual components
 * if (company?.discount) {
 *   invoices.push({ type: ServiceType.Discount })
 * } // price, sum, etc should be calculated in individual components
 * if (ServiceType.Electricity in service) {
 *   invoices.push({ type: ServiceType.Electricity })
 * } // price, sum, etc should be calculated in individual components
 */
const getCompanyAndServiceInvoices = (company, prevPayment, service) => {
  const invoices = []

  const prevInvoicesCollection =
    prevPayment?.invoice?.reduce((acc, invoice) => {
      acc[invoice.type] = invoice
      return acc
    }, {} as { [key in ServiceType]: Invoice }) || {}

  if (company?.pricePerMeter && company?.rentPart) {
    invoices.push({
      type: ServiceType.Maintenance,
      amount: company?.rentPart || 0,
      price: company?.pricePerMeter,
    })
  }

  if (company?.inflicion && ServiceType.Inflicion in service) {
    const prevPlacing = prevInvoicesCollection[ServiceType.Placing]
    const inflicionIndex = service[ServiceType.Inflicion] - 100
    const inflicionPrice = (inflicionIndex / 100) * (prevPlacing?.sum || 0)

    invoices.push({
      type: ServiceType.Placing,
      price: (prevPlacing?.sum || 0) + inflicionPrice,
    })

    invoices.push({
      type: ServiceType.Inflicion,
      price: inflicionPrice,
    })
  } else {
    const prevPlacing = prevInvoicesCollection[ServiceType.Placing]
    invoices.push({ type: ServiceType.Placing, price: prevPlacing?.sum || 0 })
  }

  if (ServiceType.Electricity in service) {
    const prevElectricity = prevInvoicesCollection[ServiceType.Electricity]
    invoices.push({
      type: ServiceType.Electricity,
      amount: prevElectricity?.amount || 0,
      lastAmount: prevElectricity?.amount || 0,
      price: service[ServiceType.Electricity],
    })
  }

  if (ServiceType.Water in service) {
    if (company?.waterPart) {
      invoices.push({
        type: ServiceType.WaterPart,
        price: (service[ServiceType.Water] * company?.waterPart) / 100,
      })
    } else {
      const prevWater = prevInvoicesCollection[ServiceType.Water]
      invoices.push({
        type: ServiceType.Water,
        amount: prevWater?.amount || 0,
        lastAmount: prevWater?.amount || 0,
        price: service[ServiceType.Water],
      })
    }
  }

  if (ServiceType.GarbageCollector in service && company?.garbageCollector) {
    invoices.push({
      type: ServiceType.GarbageCollector,
      price:
        (service[ServiceType.GarbageCollector] *
          company?.servicePricePerMeter) /
        100,
    })
  }

  if (company?.cleaning) {
    invoices.push({ type: ServiceType.Cleaning, price: company.cleaning })
  }

  if (company?.discount) {
    invoices.push({ type: ServiceType.Discount, price: company.discount })
  }

  return invoices
}

export default AddPaymentModal
