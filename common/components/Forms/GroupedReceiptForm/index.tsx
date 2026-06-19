import {
  IExtendedPayment,
  TemplateScope,
} from '@common/api/paymentApi/payment.api.types'
import { useEditPaymentMutation } from '@common/api/paymentApi/payment.api'
import { usePaymentContext } from '@components/AddPaymentModal'
import { useInvoiceCurrency } from '@modules/hooks/useInvoiceCurrency'
import { TemplateKey } from '@components/AddPaymentModal/resolveTemplate'
import { FC, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { useReceiptTemplateProps } from './useReceiptTemplateProps'
import { useInvoiceTemplateDescriptions } from './useInvoiceTemplateDescriptions'
import { applyDescriptionOverrides } from './applyDescriptionOverrides'
import { builtinTemplateItems } from './builtinTemplates'
import {
  PrinterOutlined,
  LayoutOutlined,
  RightOutlined,
  CheckOutlined,
  TableOutlined,
} from '@ant-design/icons'
import { Dropdown, Form, Tooltip, message, MenuProps } from 'antd'
import s from './style.module.scss'
import { templateMap } from './templateMap'
import InvoiceLanguageSelector from './InvoiceLanguageSelector'

interface Props {
  currPayment?: IExtendedPayment | null
  paymentData?: IExtendedPayment | null | undefined
  paymentActions: { preview: boolean; edit: boolean }
}

const GroupedReceiptForm: FC<Props> = ({ currPayment, paymentData }) => {
  const {
    form,
    template,
    setTemplate,
    setTemplateScope,
    company,
    showQuantityInPreview,
    setShowQuantityInPreview,
    invoiceLang,
    setInvoiceLang,
  } = usePaymentContext()
  const [editPayment] = useEditPaymentMutation()
  const invoiceCurrency = useInvoiceCurrency()
  const liveInvoice = Form.useWatch('invoice', form)
  const rawData = currPayment ?? paymentData ?? null
  const data = rawData
    ? {
        ...rawData,
        invoice: liveInvoice ?? rawData.invoice,
        currency: invoiceCurrency,
      }
    : rawData

  const {
    customTemplates,
    isCustomTemplate,
    currentCustomTemplate,
    descriptionOverrides,
    overrides,
  } = useInvoiceTemplateDescriptions({ data })

  const effectiveData = applyDescriptionOverrides(data, descriptionOverrides)

  const receiptProps = useReceiptTemplateProps({
    data: effectiveData,
    contextCompany: company,
    lang: invoiceLang,
    descriptionOverrides,
    overrides,
    showQuantityInPreview,
  })

  const {
    isEnglish,
    currencyLabel,
    currency,
    modernInvoiceNumber,
    domainName,
    companyLabel: receiptCompanyLabel,
    rows,
    getQty,
    subtotal,
    taxPercent,
    taxAmount,
    total,
    paymentInfoLines,
    issuedToLines,
    normalizedBankDetailsLines,
  } = receiptProps

  const componentRef = useRef<HTMLDivElement | null>(null)

  const printCompanyName =
    (typeof data?.company === 'object'
      ? data.company?.companyName
      : undefined) ??
    data?.reciever?.companyName ??
    ''

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle:
      `${printCompanyName}-inv-${modernInvoiceNumber}` || 'invoice',
  })

  if (!rawData) return null

  const companyLabel = receiptCompanyLabel

  const handleSaveTemplate = async (
    templateKey: TemplateKey,
    scope?: TemplateScope
  ) => {
    setTemplate(templateKey)
    if (!data?._id) {
      if (scope === 'company' || scope === 'domain') {
        setTemplateScope(scope)
        message.info(
          `Шаблон буде встановлено як дефолт для ${
            scope === 'company' ? 'компанії' : 'домену'
          } після створення інвойсу`
        )
      } else if (scope === 'payment') {
        setTemplateScope(undefined)
      }
      return
    }
    const result = await editPayment({
      _id: data._id,
      template: templateKey,
      _templateScope: scope !== 'payment' ? scope : undefined,
    })
    if ('error' in result) {
      message.error('Помилка збереження')
    } else if (scope === 'company') {
      message.success(`Шаблон збережено для компанії (${companyLabel})`)
    } else if (scope === 'domain') {
      message.success(`Шаблон збережено для домену (${domainName})`)
    }
  }

  const handleSaveLanguage = async (lang: 'en' | 'uk') => {
    setInvoiceLang(lang)
    if (!data?._id) return
    const result = await editPayment({ _id: data._id, invoiceLang: lang })
    if ('error' in result) {
      message.error('Помилка збереження мови')
    }
  }

  const makeSaveMenu = (templateKey: TemplateKey): MenuProps => ({
    items: [
      { key: 'payment', label: 'Зберегти для цього платежу' },
      { type: 'divider' },
      {
        key: 'company',
        label: (
          <div>
            Дефолт для компанії{' '}
            <span style={{ opacity: 0.5, fontSize: '13px' }}>
              «{companyLabel}»
            </span>
          </div>
        ),
      },
      {
        key: 'domain',
        label: (
          <div>
            Дефолт для домену{' '}
            <span style={{ opacity: 0.5, fontSize: '13px' }}>
              «{domainName}»
            </span>
          </div>
        ),
      },
    ],
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation()
      if (key === 'payment' || key === 'company' || key === 'domain') {
        handleSaveTemplate(templateKey, key)
      }
    },
  })

  const builtinDropdownItems = builtinTemplateItems.map((item) => ({
    key: item.key,
    label: (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          onClick={() => handleSaveTemplate(item.key as TemplateKey)}
          style={{ display: 'flex', gap: 6, width: '100%' }}
        >
          {template === item.key && (
            <CheckOutlined style={{ fontSize: 12, opacity: 0.7 }} />
          )}
          {item.label}
        </span>
        <Dropdown
          placement={'right' as unknown as any}
          menu={makeSaveMenu(item.key as TemplateKey)}
          trigger={['click']}
        >
          <RightOutlined
            style={{
              fontSize: 12,
              opacity: 0.7,
              padding: '0 8px',
              cursor: 'pointer',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </div>
    ),
  }))

  const customDropdownItems = customTemplates.map((ct) => ({
    key: ct._id,
    label: (
      <span
        onClick={() => handleSaveTemplate(ct._id as TemplateKey)}
        style={{ display: 'flex', gap: 6, width: '100%', alignItems: 'center' }}
      >
        {template === ct._id && (
          <CheckOutlined style={{ fontSize: 12, opacity: 0.7 }} />
        )}
        <span
          style={{
            maxWidth: 200,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {ct.name}
        </span>
      </span>
    ),
  }))

  const dropdownItems = [
    ...builtinDropdownItems,
    ...(customTemplates.length > 0
      ? [{ type: 'divider' as const }, ...customDropdownItems]
      : []),
  ]

  const baseTemplateKey = isCustomTemplate
    ? currentCustomTemplate?.baseTemplateKey || 'classic'
    : template
  const TemplateComponent = templateMap[baseTemplateKey] || templateMap.olimp

  const templateProps = {
    data: effectiveData,
    componentRef,
    isEnglish,
    showQuantityInPreview,
    currencyLabel,
    currency,
    modernInvoiceNumber,
    domainName,
    companyLabel,
    rows,
    getQty,
    subtotal,
    taxPercent,
    taxAmount,
    total,
    paymentInfoLines,
    issuedToLines,
    normalizedBankDetailsLines,
    overrides,
  }

  return (
    <>
      <Tooltip title="Друк">
        <PrinterOutlined className={s.print} onClick={handlePrint} />
      </Tooltip>

      <Dropdown
        trigger={['click']}
        placement="bottomLeft"
        menu={{ items: dropdownItems, style: { minWidth: 240 } }}
      >
        <Tooltip title={isEnglish ? 'Select template' : 'Обрати шаблон'}>
          <LayoutOutlined className={s.edit} />
        </Tooltip>
      </Dropdown>

      <Tooltip title="Показувати кількість і ціну в таблиці перегляду">
        <TableOutlined
          role="button"
          tabIndex={0}
          aria-label={
            showQuantityInPreview
              ? 'Приховати кількість і ціну в перегляді'
              : 'Показати кількість і ціну в перегляді'
          }
          aria-pressed={showQuantityInPreview}
          className={`${s.tableDetailsToggle} ${
            showQuantityInPreview ? s.tableDetailsToggleActive : ''
          }`}
          onClick={() => setShowQuantityInPreview(!showQuantityInPreview)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setShowQuantityInPreview(!showQuantityInPreview)
            }
          }}
        />
      </Tooltip>

      <span className={s.languageSelector}>
        <InvoiceLanguageSelector
          lang={invoiceLang}
          onChange={handleSaveLanguage}
        />
      </span>

      <TemplateComponent {...templateProps} />
    </>
  )
}

export default GroupedReceiptForm
