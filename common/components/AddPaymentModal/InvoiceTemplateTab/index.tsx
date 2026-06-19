import { usePaymentContext } from '@components/AddPaymentModal'
import { TemplateKey } from '@components/AddPaymentModal/resolveTemplate'
import InvoiceTemplateEditor from '@components/Forms/InvoiceTemplateEditor'
import { builtinTemplateItems } from '@components/Forms/GroupedReceiptForm/builtinTemplates'
import { useInvoiceTemplateDescriptions } from '@components/Forms/GroupedReceiptForm/useInvoiceTemplateDescriptions'
import { getPaymentProviderAndReciever } from '@utils/helpers'
import { Form, Select } from 'antd'
import s from './style.module.scss'

/**
 * "Шаблон" tab of the payment modal — pick the active template and edit it via
 * the shared <InvoiceTemplateEditor>. Lives only in edit/create mode (the tab
 * is not mounted in preview), so the read-only "Перегляд" tab stays untouched.
 */
const InvoiceTemplateTab = () => {
  const { form, template, setTemplate, company, payment, invoiceLang } =
    usePaymentContext()
  const liveInvoice = Form.useWatch('invoice', form)

  const data = payment
    ? { ...payment, invoice: liveInvoice ?? payment.invoice }
    : null

  const {
    domainId,
    customTemplates,
    isCustomTemplate,
    currentCustomTemplate,
    baseProviderDescription,
    baseReceiverDescription,
  } = useInvoiceTemplateDescriptions({ data })

  if (!domainId) {
    return (
      <div className={s.hint}>
        Оберіть домен, щоб налаштувати шаблон рахунку
      </div>
    )
  }

  const baseKey = isCustomTemplate
    ? currentCustomTemplate?.baseTemplateKey || 'classic'
    : template

  const currentLabel = isCustomTemplate
    ? currentCustomTemplate?.name || 'шаблон'
    : builtinTemplateItems.find((t) => t.key === template)?.label || template

  const { provider, reciever } = getPaymentProviderAndReciever(company)
  const previewData =
    data ??
    (company
      ? {
          provider,
          reciever,
          invoice: liveInvoice ?? [],
          currency: company.currency,
          invoiceNumber: form.getFieldValue('invoiceNumber'),
          invoiceCreationDate: form.getFieldValue('invoiceCreationDate'),
          generalSum: form.getFieldValue('generalSum'),
        }
      : undefined)

  const templateOptions = [
    {
      label: 'Вбудовані',
      options: builtinTemplateItems.map((t) => ({
        value: t.key,
        label: t.label,
      })),
    },
    ...(customTemplates.length
      ? [
          {
            label: 'Шаблони домену',
            options: customTemplates.map((t) => ({
              value: t._id,
              label: t.name,
            })),
          },
        ]
      : []),
  ]

  return (
    <div className={s.tab}>
      <div className={s.picker}>
        <span className={s.pickerLabel}>Поточний шаблон</span>
        <Select
          value={template}
          onChange={(v) => setTemplate(v as TemplateKey)}
          options={templateOptions}
          className={s.pickerSelect}
        />
      </div>

      <InvoiceTemplateEditor
        key={template}
        domainId={domainId}
        existingTemplate={isCustomTemplate ? currentCustomTemplate : null}
        baseTemplateKey={baseKey}
        baseProviderDescription={baseProviderDescription}
        baseReceiverDescription={baseReceiverDescription}
        previewData={previewData}
        contextCompany={company}
        previewLang={invoiceLang}
        defaultName={`Copy - ${currentLabel}`}
        onSaved={(tpl) => setTemplate(tpl._id as TemplateKey)}
      />
    </div>
  )
}

export default InvoiceTemplateTab
