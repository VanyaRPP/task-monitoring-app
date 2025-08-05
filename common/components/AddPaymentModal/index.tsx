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
import PriceList from '@common/components/Forms/AddPaymentForm/PriceList'
import Modal from '@components/UI/ModalWindow'
import { usePaymentFormData } from '@modules/hooks/usePaymentData'
import { Operations } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'
import { getPaymentProviderAndReciever } from '@utils/helpers'
import { Form, Tabs, TabsProps, message } from 'antd'
import { FormInstance } from 'antd/es/form/Form'
import dayjs from 'dayjs'
import {
  FC,
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from 'react'
import AddPaymentForm from '../Forms/AddPaymentForm'
import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'
import GroupedReceiptForm from '../Forms/GroupedReceiptForm'
import ReceiptForm from '../Forms/ReceiptForm'
import s from './style.module.scss'
import serviceFilter from './serviceFilter'

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

const handleNonEmpty = (form, setIsButtonDisabled) => {
  const fields = form.getFieldsValue()
  const operation = fields.operation
  let requiredFields = ['domain', 'company']
  if (operation === 'credit' || operation === Operations.Credit) {
    requiredFields = ['domain', 'company', 'generalSum', 'description']
  }
  const dis = requiredFields.some(
    (key) =>
      fields[key] === undefined || fields[key] === null || fields[key] === ''
  )
  setIsButtonDisabled(dis)
}

const AddPaymentModal: FC<Props> = ({
  closeModal,
  paymentData,
  paymentActions,
  preselectedCompany,
}) => {
  const [form] = Form.useForm()
  const [isValueChanged, setIsValueChanged] = useState(false)
  const [isButtonDisabled, setIsButtonDisabled] = useState(true)
  const [needResetInvoices, setNeedResetInvoices] = useState(false)

  const { company, service, payment, prevService, prevPayment } =
    usePaymentFormData(form, paymentData)
  const transaction = {
    AUT_CNTR_ACC: paymentData?.transaction?.AUT_CNTR_ACC || '',
    AUT_CNTR_NAM: paymentData?.transaction?.AUT_CNTR_NAM || '',
    AUT_CNTR_MFO: paymentData?.transaction?.AUT_CNTR_MFO || '',
    Description: paymentData?.transaction?.Description || '',
  }

  const [addPayment, { isLoading: isAddingLoading }] = useAddPaymentMutation()
  const [editPayment, { isLoading: isEditingLoading }] =
    useEditPaymentMutation()

  const [currPayment, setCurrPayment] = useState<IExtendedPayment>()
  const { preview, edit, create } = paymentActions

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
  const domainId = Form.useWatch('domain', form)
  const [pendingDomain, setPendingDomain] = useState<string | null>(null)
  const { data: customDomainServices } = useGetCustomServicesByDomainQuery(
    { domainId },
    { skip: !domainId }
  )
  const groups = customDomainServices?.data ?? []

  const allInvoices = useMemo(
    () => getInvoices({ company, service, payment, prevService, prevPayment }),
    [company, service, payment, prevService, prevPayment]
  )
  const allowedServices = groups.flatMap((group) => group.services)
  const filteredInvoices = useMemo(() => {
    return serviceFilter(allInvoices, allowedServices) // TODO: delete after custom service refactor
  }, [allInvoices, allowedServices])
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

  const items: TabsProps['items'] = []

  const [tabsDisabled, setTabsDisabled] = useState(false)

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
      disabled: tabsDisabled,
      children: (
        <GroupedReceiptForm
          currPayment={currPayment}
          paymentData={paymentData}
          paymentActions={paymentActions}
        />
      ),
    })
  }

  if (payment) {
    items.push({
      key: '3',
      label: 'Акт',
      disabled: tabsDisabled,
      children: <PriceList data={payment} />,
    })
  }
  if (!preview || paymentData?.type === Operations.Debit) {
    items.push({
      key: '4',
      label: 'Довідка',
      disabled: tabsDisabled,
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
    if (edit) return
    if (!domainId) return
    setNeedResetInvoices(true)
  }, [domainId, edit])

  useEffect(() => {
    if (!needResetInvoices) return
    if (allInvoices.length === 0) return
    // if (filteredInvoices?.length === 0) return

    form.resetFields(['invoice'])
    form.setFieldsValue({ invoice: filteredInvoices })

    setNeedResetInvoices(false)
  }, [allInvoices, needResetInvoices, form])

  useEffect(() => {
    if (edit) {
      setTabsDisabled(false)
    }
  }, [edit])
  const [initialValuesTabs, setInitialValuesTabs] = useState({
    domain:
      typeof payment?.domain === 'string'
        ? payment?.domain
        : payment?.domain?._id,
    street:
      typeof payment?.street === 'string'
        ? payment?.street
        : payment?.street?._id,
    monthService:
      typeof payment?.monthService === 'string'
        ? payment?.monthService
        : payment?.monthService?._id,
    company:
      typeof payment?.company === 'string'
        ? payment?.company
        : payment?.company?._id,
    operation: payment?.type || Operations.Credit,
  })

  useEffect(() => {
    setInitialValuesTabs({
      domain:
        typeof payment?.domain === 'string'
          ? payment?.domain
          : payment?.domain?._id,
      street:
        typeof payment?.street === 'string'
          ? payment?.street
          : payment?.street?._id,
      monthService:
        typeof payment?.monthService === 'string'
          ? payment?.monthService
          : payment?.monthService?._id,
      company:
        typeof payment?.company === 'string'
          ? payment?.company
          : payment?.company?._id,
      operation: payment?.type || Operations.Credit,
    })
  }, [payment])

    useEffect(() => {
      setInitialValuesTabs({
        domain: typeof payment?.domain === 'string'
          ? payment?.domain
          : payment?.domain?._id,
        street: typeof payment?.street === 'string'
          ? payment?.street
          : payment?.street?._id,
        monthService: typeof payment?.monthService === 'string'
          ? payment?.monthService
          : payment?.monthService?._id,
        company: typeof payment?.company === 'string'
          ? payment?.company
          : payment?.company?._id,
        operation: payment?.type || Operations.Credit,
      })
    }, [payment])

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
          preview
            ? { style: { display: 'none' } }
            : edit
            ? {}
            : isButtonDisabled
            ? { disabled: true }
            : null
        }
        changed={() => isValueChanged}
        onCancel={() => {
          form.resetFields()
          closeModal()
        }}
        okText={edit ? 'Зберегти' : !preview && 'Додати'}
        cancelText={preview ? 'Закрити' : 'Відміна'}
        confirmLoading={isAddingLoading || isEditingLoading}
        className={s.Modal}
        style={{ top: 20 }}
        preview={preview}
      >
        <Form
          initialValues={{
            // // TODO: fix payment typing globally to not be `domain: Partial<IDomain> | string` but `Partial<IDomain>` instead
            // eslint-disable-next-line
            // @ts-ignore
            domain: payment?.domain?._id,
            // TODO: fix payment typing globally to not be `domain: Partial<IStreet> | string` but `Partial<IStreet>` instead
            // eslint-disable-next-line
            // @ts-ignore
            street: payment?.street?._id,
            // TODO: fix payment typing globally to not be `domain: Partial<IService> | string` but `Partial<IService>` instead
            // eslint-disable-next-line
            // @ts-ignore
            monthService: payment?.monthService?._id,
            invoice: paymentData?.invoice?.length
              ? paymentData.invoice
              : filteredInvoices,
            // monthService: dateToMonthYear(payment?.monthService?.date).charAt(0).toUpperCase() + dateToMonthYear(payment?.monthService?.date).slice(1),
            // TODO: fix payment typing globally to not be `domain: Partial<IRealestate> | string` but `Partial<IRealestate>` instead
            // TODO: ???rename IRealestate to ICompany maybe, what the realestate means actually???
            // eslint-disable-next-line
            // @ts-ignore
            company: preselectedCompany || payment?.company?._id,
            // company: payment?.company?.companyName,
            description: payment?.description,
            generalSum: payment?.generalSum,
            invoiceNumber: payment?.invoiceNumber,
            invoiceCreationDate: dayjs(payment?.invoiceCreationDate),
            operation: payment?.type || Operations.Credit,
          }}
          form={form}
          layout="vertical"
          className={s.Form}
          onValuesChange={(changedValues, allValues) => {
            setIsValueChanged(true)
            handleNonEmpty(form, setIsButtonDisabled)

            const domainChanged = allValues.domain !== initialValuesTabs.domain
            const streetChanged = allValues.street !== initialValuesTabs.street
            const monthServiceChanged =
              allValues.monthService !== initialValuesTabs.monthService
            const companyChanged =
              allValues.company !== initialValuesTabs.company
            const operationChanged =
              allValues.operation !== initialValuesTabs.operation

            if (
              domainChanged ||
              streetChanged ||
              monthServiceChanged ||
              companyChanged ||
              operationChanged
            ) {
              setTabsDisabled(true)
            } else {
              setTabsDisabled(false)
            }
          }}
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

export default AddPaymentModal
