import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'
import { useCreateCustomServiceMutation } from '@common/api/customServicesApi/customServices.api'
import { useGetDomainByPkQuery } from '@common/api/domainApi/domain.api'
import { buildPaymentPayload } from './buildPaymentPayload'
import { keepInvoiceRow } from './invoiceRowFilter'
import { resolveTemplate, TemplateKey } from './resolveTemplate'
import {
  useAddPaymentMutation,
  useEditPaymentMutation,
} from '@common/api/paymentApi/payment.api'
import {
  useGetPaymentChangeLogsQuery,
  useDeletePaymentChangeLogMutation,
} from '@common/api/changelogApi/changelog.api'
import {
  IExtendedPayment,
  IPayment,
  TemplateScopeTarget,
} from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import PriceList from '@common/components/Forms/AddPaymentForm/PriceList'
import { useResolveMonthServiceId } from '@common/components/Forms/AddPaymentForm/useResolveMonthServiceId'
import Modal from '@components/UI/ModalWindow'
import { usePaymentFormData } from '@modules/hooks/usePaymentData'
import { Operations, Currency, ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'
import {
  getPaymentProviderAndReciever,
  normalizeCurrency,
} from '@utils/helpers'
import { Form, Tabs, TabsProps, message } from 'antd'
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
import { getPreviewQtyStorageKey } from '../Forms/GroupedReceiptForm/previewQtyStorage'
import PaymentReceiptForm from '../Forms/PaymentReceiptForm'
import ReceiptForm from '../Forms/ReceiptForm'
import serviceFilter from './serviceFilter'
import { normalizeTechnicalTransactionId } from '../Pages/BankTransactions/components/TransactionsTable/components/bankHelper'
import s from './style.module.scss'

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
  templateScope?: TemplateScopeTarget
  setTemplateScope: (scope: TemplateScopeTarget | undefined) => void
  showQuantityInPreview: boolean
  setShowQuantityInPreview: (value: boolean) => void
  invoiceLang: 'en' | 'uk'
  setInvoiceLang: (lang: 'en' | 'uk') => void
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
  templateScope: undefined,
  setTemplateScope: () => void 0,
  showQuantityInPreview: false,
  setShowQuantityInPreview: () => void 0,
  invoiceLang: 'uk',
  setInvoiceLang: () => void 0,
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
  const autoSelectedChangelogRef = useRef(false)
  const lastLoadedCompanyId = useRef<string | null>(null)
  const [changed, setChanged] = useState(false)
  const [saved, setSaved] = useState(false)
  const [currPayment, setCurrPayment] = useState<IExtendedPayment>()
  const companyDefaultTemplate =
    typeof paymentData?.company === 'object'
      ? (paymentData.company as any)?.defaultTemplate
      : (paymentData as any)?.defaultTemplate
  const paymentDomainId =
    typeof paymentData?.domain === 'object'
      ? paymentData.domain?._id
      : paymentData?.domain || preselectedDomain || undefined
  const domainDefaultTemplate =
    typeof paymentData?.domain === 'object'
      ? (paymentData.domain as any)?.defaultTemplate
      : undefined
  const [template, setTemplate] = useState<TemplateKey>(
    resolveTemplate(
      paymentData?.template,
      companyDefaultTemplate,
      domainDefaultTemplate
    )
  )
  const [templateScope, setTemplateScope] = useState<
    TemplateScopeTarget | undefined
  >()

  const [showQuantityInPreview, setShowQuantityInPreviewState] = useState(false)
  const [activeTabKey, setActiveTabKey] = useState(preview ? '2' : '1')
  const [invoiceLang, setInvoiceLang] = useState<'en' | 'uk'>(
    paymentData?.invoiceLang ??
      (paymentData?.currency && paymentData.currency !== Currency.UAH
        ? 'en'
        : 'uk')
  )

  const setShowQuantityInPreview = useCallback(
    (value: boolean) => {
      setShowQuantityInPreviewState(value)
      if (typeof window === 'undefined') return
      sessionStorage.setItem(
        getPreviewQtyStorageKey(paymentId),
        value ? '1' : '0'
      )
    },
    [paymentId]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem(getPreviewQtyStorageKey(paymentId))
    if (raw === '1') setShowQuantityInPreviewState(true)
    if (raw === '0') setShowQuantityInPreviewState(false)
  }, [paymentId])

  const domainId = Form.useWatch('domain', form)
  const selectedChangelogId = Form.useWatch('changelogId', form)

  const activeDomainId = String(domainId || paymentDomainId || '')
  const { data: fetchedDomain } = useGetDomainByPkQuery(
    { domainId: activeDomainId },
    { skip: !activeDomainId || typeof paymentData?.domain === 'object' }
  )

  useEffect(() => {
    if (paymentData?.template) return
    const resolved = fetchedDomain?.defaultTemplate
    if (resolved) setTemplate(resolved as TemplateKey)
  }, [activeDomainId, fetchedDomain?.defaultTemplate, paymentData?.template])

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

  const changelogOptions = useChangelogOptions(
    changelogRes,
    handleDeleteChangeLog
  )

  useEffect(() => {
    if (autoSelectedChangelogRef.current) return
    const logs = changelogRes?.data
    if (!logs?.length) return

    const latestManualLog = logs.find((log) => log.reason === 'manual')
    if (!latestManualLog) return

    autoSelectedChangelogRef.current = true
    form.setFieldsValue({ changelogId: latestManualLog._id })
  }, [changelogRes?.data, form])

  // `usePaymentFormData` currently returns paymentData unchanged as `payment`,
  // so we destructure only the actual derived fields and use `paymentData`
  // directly everywhere a saved payment is needed.
  const { company, service, prevService, prevPayment } = usePaymentFormData(
    form,
    paymentData
  )
  const { provider, reciever } = getPaymentProviderAndReciever(company)

  const transaction = {
    AUT_CNTR_ACC: paymentData?.transaction?.AUT_CNTR_ACC || '',
    AUT_CNTR_NAM: paymentData?.transaction?.AUT_CNTR_NAM || '',
    AUT_CNTR_MFO: paymentData?.transaction?.AUT_CNTR_MFO || '',
    Description: paymentData?.transaction?.Description || '',
    TECHNICAL_TRANSACTION_ID: normalizeTechnicalTransactionId(
      paymentData?.transaction?.TECHNICAL_TRANSACTION_ID
    ),
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
  const [createCustomService] = useCreateCustomServiceMutation()

  const resolveMonthServiceId = useResolveMonthServiceId()
  const { data: customDomainServices } = useGetCustomServicesByDomainQuery(
    { domainId },
    { skip: !domainId }
  )

  const filteredInvoices = useMemo(() => {
    const allInvoices = getInvoices({
      company,
      service,
      payment: paymentData,
      prevService,
      prevPayment,
    })

    const groups = customDomainServices?.data ?? []
    const allowedServices = groups.flatMap((group) => group.services)

    const serviceFilteredInvoices = serviceFilter(allInvoices, allowedServices)
    const hasDiscount = serviceFilteredInvoices.some(
      (inv) => inv.type === 'discount'
    )

    if (!hasDiscount && company?.discount) {
      serviceFilteredInvoices.push({
        type: 'discount',
        name: 'Знижка',
        price: company.discount,
        sum: company.discount,
      })
    }

    return serviceFilteredInvoices?.filter(keepInvoiceRow)
  }, [
    company,
    service,
    paymentData,
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

  if (
    paymentData &&
    paymentData?.type !== Operations.Credit &&
    template !== 'olimp'
  ) {
    items.push({
      key: '3',
      label: 'Акт',
      disabled: !shouldTabsEnabled,
      children: <PriceList data={currPayment ?? paymentData} />,
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

  /**
   * Resolve `monthService` (which may still be a placeholder like "month-2026-04")
   * into a real id, sync it back into the form, and return it. Returns null if
   * resolution fails (caller decides whether to surface an error).
   */
  const prepareMonthService = useCallback(
    async (values: any): Promise<string | null> => {
      try {
        const monthServiceId = await resolveMonthServiceId(
          values.monthService,
          values.domain,
          values.street
        )
        form.setFieldsValue({ monthService: monthServiceId })
        return monthServiceId
      } catch (e) {
        console.error('resolveMonthServiceId failed', e)
        message.error('Не вдалося підготувати місяць послуг')
        return null
      }
    },
    [resolveMonthServiceId, form]
  )

  const saveAdHocCustomServices = useCallback(
    async (invoices: any[], currentDomainId: string) => {
      if (!currentDomainId) return

      const adHocInvoices = invoices.filter(
        (inv) =>
          inv?.type === ServiceType.Custom &&
          !inv?.customService &&
          inv?.saveToDomain === true &&
          (inv?.name || inv?.description)
      )

      for (const inv of adHocInvoices) {
        const name = (inv.name || inv.description || '').trim()
        if (!name) continue

        try {
          await createCustomService({
            name,
            domainId: currentDomainId,
          }).unwrap()
        } catch (e: any) {
          if (e?.status !== 409) {
            console.warn('createCustomService failed for', name, e)
          }
        }
      }
    },
    [createCustomService]
  )

  const handleOk = async () => {
    setChanged(false)
    setSaved(true)

    const values = await form.validateFields()

    if (values.operation === Operations.Credit) {
      await handleSubmit()
      return
    }

    const monthServiceId = await prepareMonthService(values)
    if (monthServiceId === null) {
      setSaved(false)
      setChanged(true)
      return
    }

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

    const monthServiceId = await prepareMonthService(formData)
    if (monthServiceId === null) return

    const payment = buildPaymentPayload({
      formData,
      monthServiceId,
      provider,
      reciever,
      transaction,
      template,
      invoiceLang,
    })

    const finalPayload = templateScope
      ? { ...payment, _templateScope: templateScope }
      : payment

    const response = edit
      ? await editPayment({
          _id: paymentData?._id,
          ...finalPayload,
        })
      : await addPayment(finalPayload)

    if ('data' in response) {
      const currentDomainId = String(domainId || paymentDomainId || '')
      if (currentDomainId && formData.invoice?.length) {
        await saveAdHocCustomServices(formData.invoice, currentDomainId)
      }

      const action = edit ? 'Збережено' : 'Додано'
      form.resetFields()
      message.success(action)

      const channel = new BroadcastChannel('payments_sync_channel')
      channel.postMessage('PAYMENT_CREATED')
      setTimeout(() => channel.close(), 100)

      closeModal(true)
    } else {
      const action = edit ? 'збереженні' : 'додаванні'
      message.error(`Помилка при ${action} рахунку`)
    }
  }

  useEffect(() => {
    if (activeTabKey !== '1' || saved || !company || !company._id) return

    const isEditing = !!paymentId || edit
    if (isEditing) {
      lastLoadedCompanyId.current = company._id
      if (!form.getFieldValue('currency')) {
        form.setFieldValue('currency', normalizeCurrency(company.currency))
      }
      return
    }

    const hasFilteredInvoices =
      Array.isArray(filteredInvoices) && filteredInvoices.length > 0
    if (!hasFilteredInvoices) return
    // Re-seed `invoice` whenever upstream data (company, service, prevService,
    // prevPayment, customDomainServices) changes — that's exactly when
    // `filteredInvoices` gets a new reference. Editing existing payments is
    // already short-circuited above, so user input on a CREATE form is reset
    // only when the user changes domain/street/company/month, which is the
    // intended behavior.
    form.setFieldsValue({ invoice: filteredInvoices })

    const isNewCompanySelected = lastLoadedCompanyId.current !== company._id
    if (isNewCompanySelected) {
      form.setFieldValue('currency', normalizeCurrency(company.currency))
      lastLoadedCompanyId.current = company._id
    }
  }, [company, filteredInvoices, paymentId, edit, activeTabKey, saved, form])

  return (
    <PaymentContext.Provider
      value={{
        company,
        service,
        prevService,
        payment: paymentData,
        prevPayment,
        form,
        template,
        setTemplate,
        templateScope,
        setTemplateScope,
        showQuantityInPreview,
        setShowQuantityInPreview,
        invoiceLang,
        setInvoiceLang,
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
            domain: preselectedDomain || getId(paymentData?.domain),
            street: getId(paymentData?.street),
            company: preselectedCompany || getId(paymentData?.company),
            monthService: getId(paymentData?.monthService),
            invoice:
              paymentData?.invoice && paymentData.invoice.length > 0
                ? paymentData.invoice
                : filteredInvoices,
            description: paymentData?.description,
            generalSum: paymentData?.generalSum,
            currency: paymentData?.currency
              ? normalizeCurrency(paymentData.currency)
              : undefined,
            invoiceNumber: paymentData?.invoiceNumber,
            invoiceCreationDate: dayjs(paymentData?.invoiceCreationDate),
            operation: paymentData?.type || Operations.Debit,
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

export default AddPaymentModal
