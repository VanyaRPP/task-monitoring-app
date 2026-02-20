import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'
import {
  useAddPaymentMutation,
  useEditPaymentMutation,
} from '@common/api/paymentApi/payment.api'
import { 
  useGetPaymentChangeLogsQuery, 
  useDeletePaymentChangeLogMutation 
} from '@common/api/changelogApi/changelog.api'
import {
  IExtendedPayment,
  IPayment,
} from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import PriceList from '@common/components/Forms/AddPaymentForm/PriceList'
import Modal from '@components/UI/ModalWindow'
import { usePaymentFormData } from '@modules/hooks/usePaymentData'
import { Operations } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'
import { getPaymentProviderAndReciever } from '@utils/helpers'
import { Form, Tabs, TabsProps, message, Tooltip } from 'antd'
import { FormInstance } from 'antd/es/form/Form'
import { useChangelogOptions } from './changelog/useChangelogOptions'
import dayjs from 'dayjs'
import {
  FC,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react'
import AddPaymentForm from '../Forms/AddPaymentForm'
import GroupedReceiptForm from '../Forms/GroupedReceiptForm'
import PaymentReceiptForm from '../Forms/PaymentReceiptForm'
import ReceiptForm from '../Forms/ReceiptForm'
import serviceFilter from './serviceFilter'
import s from './style.module.scss'

const DEFAULT_INVOICES = [
  'discount',
  'maintenancePrice',
  'garbageCollectorPrice',
  'electricityPrice',
]

interface Props {
  closeModal: VoidFunction
  paymentData?: any
  paymentActions?: { edit: boolean; preview: boolean; create?: boolean }
  preselectedCompany?: string
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

const getId = (obj?: string | Partial<{ _id: string }>) => {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  return obj._id
}

const AddPaymentModal: FC<Props> = ({
  closeModal,
  paymentData,
  paymentActions,
  preselectedCompany,
}) => {
  const { preview, edit } = paymentActions ?? { preview: false, edit: false }

  const paymentId = paymentData?._id
  const [form] = Form.useForm()
  const firstRunRef = useRef(true)
  const restoringRef = useRef(false)
  const [changed, setChanged] = useState(false)
  const [saved, setSaved] = useState(false)
  const [currPayment, setCurrPayment] = useState<IExtendedPayment>()
  const [activeTabKey, setActiveTabKey] = useState(
    getActiveTab(paymentData, preview)
  )

  const domainId = Form.useWatch('domain', form)
  const selectedChangelogId = Form.useWatch('changelogId', form)

  const { data: changelogRes, isLoading: changelogLoading } =
    useGetPaymentChangeLogsQuery(paymentId, { skip: !edit || !paymentId })

  const [deleteChangeLog] = useDeletePaymentChangeLogMutation()

  const handleDeleteChangeLog = async (logId: string) => {
    if (!logId || !paymentId) return
    
    try {
      await deleteChangeLog({ paymentId, changeLogid: logId }).unwrap()
    } catch (error) {
      console.error('Error deleting changelog:', error)
    }
  }

  const changelogOptions = useChangelogOptions(changelogRes, handleDeleteChangeLog)

  const { company, service, payment, prevService, prevPayment } =
    usePaymentFormData(form, paymentData)
  const { provider, reciever } = getPaymentProviderAndReciever(company)

  const transaction = {
    AUT_CNTR_ACC: paymentData?.transaction?.AUT_CNTR_ACC || '',
    AUT_CNTR_NAM: paymentData?.transaction?.AUT_CNTR_NAM || '',
    AUT_CNTR_MFO: paymentData?.transaction?.AUT_CNTR_MFO || '',
    Description: paymentData?.transaction?.Description || '',
  }

  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false
      return
    }
    form.resetFields(['company'])
  }, [domainId, form])

  const [addPayment, { isLoading: isAddingLoading }] = useAddPaymentMutation()
  const [editPayment, { isLoading: isEditingLoading }] =
    useEditPaymentMutation()
  const { data: customDomainServices } = useGetCustomServicesByDomainQuery(
    { domainId },
    { skip: !domainId }
  )

  const filteredInvoices = useMemo(() => {
    const allInvoices = getInvoices({
      company,
      service,
      payment,
      prevService,
      prevPayment,
    })

    const groups = customDomainServices?.data ?? []
    const allowedServices = groups.flatMap((group) => group.services)

    const serviceFilteredInvoices = serviceFilter(allInvoices, allowedServices)

    return serviceFilteredInvoices?.filter(
      (invoice) => invoice?.sum > 0 || DEFAULT_INVOICES.includes(invoice?.type)
    )
  }, [
    company,
    service,
    payment,
    prevService,
    prevPayment,
    customDomainServices,
  ])

  useEffect(() => {
    if (!selectedChangelogId) return

    const logs = changelogRes?.data ?? []
    const selected = logs.find((l) => l._id === selectedChangelogId)
    if (!selected?.invoiceData) return

    restoringRef.current = true

    form.setFieldsValue({
      invoiceNumber: selected.invoiceData.invoiceNumber,
      invoiceCreationDate: dayjs(selected.invoiceData.invoiceCreationDate),
      description: selected.invoiceData.description,
      generalSum: selected.invoiceData.generalSum,
      operation: selected.invoiceData.type,
      invoice: selected.invoiceData.invoice,
    })

    queueMicrotask(() => {
      restoringRef.current = false
    })
  }, [selectedChangelogId, changelogRes, form])

  const items: TabsProps['items'] = []
  const shouldTabsEnabled = (edit && !changed) || preview || saved

  if (!preview) {
    items.push({
      key: '1',
      label: 'Рахунок',
      children: (
        <AddPaymentForm
          paymentActions={paymentActions}
          changelogOptions={changelogOptions}
          changelogLoading={changelogLoading}
        />
      ),
    })
  }

  if (
    !preview ||
    paymentData?.type === Operations.Debit ||
    paymentData?.type === Operations.Credit
  ) {
    items.push({
      key: '2',
      label: 'Перегляд',
      disabled: !shouldTabsEnabled,
      children:
        paymentData?.type === Operations.Credit ? (
          <PaymentReceiptForm
            currPayment={currPayment}
            paymentData={paymentData}
            paymentActions={paymentActions}
          />
        ) : (
          <GroupedReceiptForm
            currPayment={currPayment}
            paymentData={paymentData}
            paymentActions={paymentActions}
          />
        ),
    })
  }

  if (payment && paymentData?.type !== Operations.Credit) {
    items.push({
      key: '3',
      label: 'Акт',
      disabled: !shouldTabsEnabled,
      children: <PriceList data={payment} />,
    })
  }

  const operation = Form.useWatch('operation', form)

  const effectiveOperation = preview ? paymentData?.type : operation

  if (effectiveOperation === Operations.Debit) {
    items.push({
      key: '4',
      label: 'Довідка',
      disabled: !shouldTabsEnabled,
      children: (
        <ReceiptForm
          currPayment={currPayment}
          paymentData={paymentData}
          paymentActions={paymentActions}
        />
      ),
    })
  }

  const handleChange = () => {
    if (restoringRef.current) return
    setSaved(false)
    setChanged(true)
  }

  const handleOk = async () => {
    setChanged(false)
    setSaved(true)

    const values = await form.validateFields()

    if (values.operation === Operations.Credit) {
      handleSubmit()
      return
    }

    setCurrPayment({ ...values, provider, reciever })
    setActiveTabKey('2')
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
      transaction,
      invoice: formData.debit
        ? formData.invoice.filter((invoice) => +invoice.sum !== 0)
        : [],
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

  useEffect(() => {
    if (activeTabKey !== '1' || saved) return
    form.setFieldsValue({ invoice: filteredInvoices })
  }, [filteredInvoices, saved, activeTabKey, form])

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
        okButtonProps={
          preview ? { style: { display: 'none' } } : edit ? {} : null
        }
        changed={() => changed}
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
            changelogId: undefined,
            domain: getId(payment?.domain),
            street: getId(payment?.street),
            company: preselectedCompany || getId(payment?.company),
            monthService: getId(payment?.monthService),
            invoice: payment?.invoice || filteredInvoices,
            description: payment?.description,
            generalSum: payment?.generalSum,
            invoiceNumber: payment?.invoiceNumber,
            invoiceCreationDate: dayjs(payment?.invoiceCreationDate),
            operation: payment?.type || Operations.Credit,
          }}
          form={form}
          layout="vertical"
          className={s.Form}
          onChange={handleChange}
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

function getActiveTab(paymentData, preview) {
  if (preview) return '2'
  if (paymentData?.type === Operations.Credit) return '1'
  return '1'
}

export default AddPaymentModal
