import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'
import { resolveTemplate, TemplateKey } from './resolveTemplate'
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
import {
  serviceApi,
  useAddServiceMutation,
} from '@common/api/serviceApi/service.api'
import { IService } from '@common/api/serviceApi/service.api.types'
import PriceList from '@common/components/Forms/AddPaymentForm/PriceList'
import {
  isMonthServicePlaceholder,
  parseMonthServicePlaceholder,
} from '@common/components/Forms/AddPaymentForm/month-service-placeholder'
import Modal from '@components/UI/ModalWindow'
import { usePaymentFormData } from '@modules/hooks/usePaymentData'
import { useAppDispatch } from '@modules/store/hooks'
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
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
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
  closeModal: (success?: boolean) => void
  paymentData?: any
  paymentActions?: { edit: boolean; preview: boolean; create?: boolean }
  preselectedCompany?: string
  preselectedDomain?: string
}

export interface IPaymentContext {
  payment: IPayment
  prevPayment: IPayment
  service: IService
  prevService: IService
  company: IRealestate
  form: FormInstance
  template: TemplateKey
  setTemplate: (t: TemplateKey) => void
}

export const PaymentContext = createContext<IPaymentContext>({
  payment: null,
  prevPayment: null,
  service: null,
  prevService: null,
  company: null,
  form: null,
  template: 'classic', 
  setTemplate: () => void 0,
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
  preselectedDomain,
}) => {
  const { preview, edit } = paymentActions ?? { preview: false, edit: false }

  const paymentId = paymentData?._id
  const [form] = Form.useForm()
  const firstRunRef = useRef(true)
  const restoringRef = useRef(false)
  const lastLoadedCompanyId = useRef<string | null>(null)
  const [changed, setChanged] = useState(false)
  const [saved, setSaved] = useState(false)
  const [currPayment, setCurrPayment] = useState<IExtendedPayment>()
  const companyDefaultTemplate =
    typeof paymentData?.company === 'object'
      ? (paymentData.company as any)?.defaultTemplate
      : (paymentData as any)?.defaultTemplate
  const domainDefaultTemplate =
    typeof paymentData?.domain === 'object'
      ? (paymentData.domain as any)?.defaultTemplate
      : undefined
  const [template, setTemplate] = useState<TemplateKey>(
    resolveTemplate(paymentData?.template, companyDefaultTemplate, domainDefaultTemplate)
  )
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
    TECHNICAL_TRANSACTION_ID: paymentData?.transaction?.TECHNICAL_TRANSACTION_ID,
  }

  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false
      return
    }
    if (preselectedCompany) return
    form.resetFields(['company'])
  }, [domainId, form])

  const dispatch = useAppDispatch()
  const [addService] = useAddServiceMutation()
  const [addPayment, { isLoading: isAddingLoading }] = useAddPaymentMutation()
  const [editPayment, { isLoading: isEditingLoading }] =
    useEditPaymentMutation()

  const resolveMonthServiceId = useCallback(
    async (raw: string, domain: string, street: string) => {
      if (!isMonthServicePlaceholder(raw)) {
        return raw
      }
      const monthStart = parseMonthServicePlaceholder(raw)
      const year = monthStart.year()
      const month = monthStart.month() + 1

      const existing = await dispatch(
        serviceApi.endpoints.getAllServices.initiate(
          {
            domainId: domain,
            streetId: street,
            year,
            month,
            limit: 1,
          },
          { subscribe: false, forceRefetch: true }
        )
      ).unwrap()

      const found = existing.data?.[0]
      if (found?._id) {
        return found._id
      }

      const created = await addService({
        domain,
        street,
        date: monthStart.startOf('month').toDate(),
        rentPrice: 0,
        electricityPrice: 0,
        waterPrice: 0,
        waterPriceTotal: 0,
        description: '',
        customServices: [],
      }).unwrap()

      return created.data._id
    },
    [dispatch, addService]
  )
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
    const hasDiscount = serviceFilteredInvoices.some((inv) => inv.type === 'discount')

    if (!hasDiscount && company?.discount) {
      serviceFilteredInvoices.push({
        type: 'discount',
        name: 'Знижка',
        price: company.discount,
        sum: company.discount,
      })
    }

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

  if (payment && paymentData?.type !== Operations.Credit && template !== 'olimp') {
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
      await handleSubmit()
      return
    }

    let monthServiceId = values.monthService
    try {
      monthServiceId = await resolveMonthServiceId(
        values.monthService,
        values.domain,
        values.street
      )
    } catch (e) {
      console.error('resolveMonthServiceId failed', e)
      message.error('Не вдалося підготувати місяць послуг')
      setSaved(false)
      setChanged(true)
      return
    }
    form.setFieldsValue({ monthService: monthServiceId })
    setCurrPayment({
      ...values,
      monthService: monthServiceId,
      provider,
      reciever,
    })
    setActiveTabKey('2')
  }

  const handleSubmit = async () => {
    const formData = await form.validateFields()

    let monthServiceId = formData.monthService
    try {
      monthServiceId = await resolveMonthServiceId(
        formData.monthService,
        formData.domain,
        formData.street
      )
    } catch (e) {
      console.error('resolveMonthServiceId failed', e)
      message.error('Не вдалося підготувати місяць послуг')
      return
    }
    form.setFieldsValue({ monthService: monthServiceId })

    const payment = {
      invoiceNumber: formData.invoiceNumber,
      type: formData.operation,
      domain: formData.domain,
      street: formData.street,
      company: formData.company,
      monthService: monthServiceId,
      invoiceCreationDate: formData.invoiceCreationDate
        ? new Date(
            Date.UTC(
              formData.invoiceCreationDate.year(),
              formData.invoiceCreationDate.month(),
              formData.invoiceCreationDate.date()
            )
          )
        : null,
      description: formData.description || '',
      generalSum: formData.generalSum || formData.debit,
      provider,
      reciever,
      transaction,
      invoice: formData.debit
        ? formData.invoice.filter((invoice) => +invoice.sum !== 0)
        : [],
      template,
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
      closeModal(true)
    } else {
      const action = edit ? 'збереженні' : 'додаванні'
      message.error(`Помилка при ${action} рахунку`)
    }
  }

  useEffect(() => {
    if (activeTabKey !== '1' || saved || !company || !company._id) return

    const isEditing = !!paymentId || edit
    const currentInvoices = form.getFieldValue('invoice')
    const hasCurrentInvoices =
      Array.isArray(currentInvoices) && currentInvoices.length > 0
    const hasFilteredInvoices =
      Array.isArray(filteredInvoices) && filteredInvoices.length > 0

    if (isEditing) {
      lastLoadedCompanyId.current = company._id
      return
    }

    const isNewCompanySelected = lastLoadedCompanyId.current !== company._id
    const shouldHydrateEmptyInvoices = !hasCurrentInvoices && hasFilteredInvoices

    if (isNewCompanySelected || shouldHydrateEmptyInvoices) {
      form.setFieldsValue({ invoice: filteredInvoices })
      lastLoadedCompanyId.current = company._id
    }
  }, [company, filteredInvoices, paymentId, edit, activeTabKey, saved, form])

  return (
    <PaymentContext.Provider
      value={{
        company,
        service,
        prevService,
        payment,
        prevPayment,
        form,
        template,
        setTemplate,
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
            domain: preselectedDomain || getId(payment?.domain),
            street: getId(payment?.street),
            company: preselectedCompany || getId(payment?.company),
            monthService: getId(payment?.monthService),
            invoice: (payment?.invoice && payment.invoice.length > 0) 
              ? payment.invoice 
              : filteredInvoices,
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

function getActiveTab(_paymentData: any, preview: boolean): string {
  return preview ? '2' : '1'
}

export default AddPaymentModal
