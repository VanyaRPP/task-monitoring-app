import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { useEditPaymentMutation } from '@common/api/paymentApi/payment.api'
import { usePaymentContext } from '@components/AddPaymentModal'
import { TemplateKey } from '@components/AddPaymentModal/resolveTemplate'
import { getCurrencyShortLabel, normalizeCurrency } from '@utils/helpers'
import { Currency } from '@utils/constants'
import dayjs from 'dayjs'
import { FC, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import {
  PrinterOutlined,
  LayoutOutlined,
  RightOutlined,
  CheckOutlined,
  TableOutlined,
} from '@ant-design/icons'
import { Dropdown, Tooltip, message, MenuProps } from 'antd'
import dynamic from 'next/dynamic'
import s from './style.module.scss'

const templateItems = [
  { key: 'classic',    label: 'Класичний шаблон' },
  { key: 'olimp',      label: 'OLIMP DIGITAL OÜ' },
  { key: 'ledger',     label: 'Formal Ledger' },
  { key: 'official',   label: 'Official Invoice' },
]

const templateMap = {
  classic: dynamic(() => import('./templates/classic'), { ssr: false }),
  ledger:  dynamic(() => import('./templates/ledger'),  { ssr: false }),
  olimp:   dynamic(() => import('./templates/olimp'),   { ssr: false }),
  official: dynamic(() => import('./templates/official'), { ssr: false }),
}


interface Props {
  currPayment?: IExtendedPayment | null
  paymentData?: IExtendedPayment | null | undefined
  paymentActions: { preview: boolean; edit: boolean }
}

const GroupedReceiptForm: FC<Props> = ({
  currPayment,
  paymentData,
  paymentActions: _paymentActions,
}) => {
  const { template, setTemplate, company, showQuantityInPreview, setShowQuantityInPreview } =
    usePaymentContext()
  const [editPayment] = useEditPaymentMutation()
  const rawData = currPayment ?? paymentData ?? null
  const data = rawData as any
  const currency =
    data?.currency || data?.company?.currency || company?.currency || data?.domain?.currency
  const currencyLabel = getCurrencyShortLabel(currency)
  const isEnglish = normalizeCurrency(currency) !== Currency.UAH
  const invoiceDatePrefix = dayjs(data?.invoiceCreationDate).isValid()
    ? dayjs(data?.invoiceCreationDate).format('DDMMYY')
    : ''
  const modernInvoiceNumber = `${invoiceDatePrefix}${data?.invoiceNumber || ''}`
  const domainName =
    data?.domain?.name ||
    (typeof company?.domain === 'object' ? company?.domain?.name : '')
  const rows = (data?.invoice || []).filter((item: any) => Number(item?.sum) !== 0)

  const getQty = (item: any) => {
    if (Number.isFinite(Number(item?.amount))) {
      if (Number.isFinite(Number(item?.lastAmount))) {
        return Number(item.amount) - Number(item.lastAmount)
      }
      return Number(item.amount)
    }
    return 1
  }

  const subtotal = rows.reduce(
    (acc: number, item: any) => acc + Number(item?.sum || 0),
    0
  )
  const taxPercent = 0
  const taxAmount = 0
  const total = subtotal + taxAmount

  const domainDescription =
    data?.domain?.description ||
    (typeof company?.domain === 'object' ? company?.domain?.description : '')

  const issuedToLines = [...(domainDescription?.trim()?.split('\n') || [])].filter(
    Boolean
  )

  const receiverDescriptionLines = (
    data?.reciever?.description?.split('\n') || []
  )
    .map((line: string) => line?.trim())
    .filter(Boolean)

  const bankDetailsTriggerRegex =
    /(account details|usd account details|iban|swift|bic|bank name|bank address|bank name and address|рахунок|банк|мфо)/i

  const paymentInfoDescriptionLines: string[] = []
  const bankDetailsLines: string[] = []
  let isBankSection = false

  receiverDescriptionLines.forEach((line: string) => {
    if (bankDetailsTriggerRegex.test(line)) {
      isBankSection = true
    }

    if (isBankSection) {
      bankDetailsLines.push(line)
    } else {
      paymentInfoDescriptionLines.push(line)
    }
  })

  const bankAddressLabelRegex =
    /^(bank name and address|bank name|bank address|назва банку|адреса банку)\s*:/i

  const normalizedBankDetailsLines = bankDetailsLines.reduce(
    (acc: string[], line: string) => {
      const normalizedLine = line?.trim()
      if (!normalizedLine) {
        return acc
      }

      const lastLine = acc[acc.length - 1] || ''
      const shouldAppendToPrevious =
        !!lastLine &&
        bankAddressLabelRegex.test(lastLine) &&
        !normalizedLine.includes(':')

      if (shouldAppendToPrevious) {
        acc[acc.length - 1] = `${lastLine} ${normalizedLine}`.trim()
      } else {
        acc.push(normalizedLine)
      }

      return acc
    },
    []
  )

  const entrepreneurTitleRegex =
    /^(private entrepreneur|private enterprise|fop|фоп|фізична особа\s*-?\s*підприємець)$/i

  const normalizedCompanyName = (data?.reciever?.companyName || '').trim()
  const firstPaymentInfoLine = (paymentInfoDescriptionLines?.[0] || '').trim()
  const hasEntrepreneurTitle = entrepreneurTitleRegex.test(firstPaymentInfoLine)

  const companyDisplayName = hasEntrepreneurTitle
    ? `${firstPaymentInfoLine} ${normalizedCompanyName}`.trim()
    : normalizedCompanyName

  const paymentInfoBodyLines = hasEntrepreneurTitle
    ? paymentInfoDescriptionLines.slice(1)
    : paymentInfoDescriptionLines

  const shouldPrependDescriptionTitleLine = hasEntrepreneurTitle || !normalizedCompanyName

  const paymentInfoLines = [
    ...(shouldPrependDescriptionTitleLine && companyDisplayName
      ? [companyDisplayName]
      : []),
    ...paymentInfoBodyLines,
    ...(data?.reciever?.adminEmails || []),
  ].filter(Boolean)

  const componentRef = useRef<HTMLDivElement | null>(null)

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle:
      (data?.company?.companyName ?? data?.reciever?.companyName ?? '') +
        '-inv-' +
        (data?.invoiceNumber ?? '') || 'invoice',
  })
  if (!rawData) {
    return null
  }

  const handleSendToTelegram = async () => {
    const hide = message.loading('Генерація та відправка PDF...', 0);

    try {
      const response = await fetch('/api/telegram/send-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentData: data }),
      });

      if (response.ok) {
        message.success('Готово! Інвойс уже в Telegram.');
      } else {
        throw new Error('Помилка сервера при генерації PDF');
      }
    } catch (err: any) {
      message.error(err.message);
    } finally {
      hide();
    }
  };

  const companyLabel = (data?.company as any)?.companyName ?? company?.companyName ?? ''

  const handleSaveTemplate = async (templateKey: TemplateKey, scope?: 'company' | 'domain' | 'payment') => {
    if (!data?._id) return message.warning('Платіж не знайдено')
    setTemplate(templateKey)
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

  const makeSaveMenu = (templateKey: TemplateKey): MenuProps => ({
    items: [
      {
        key: 'payment',
        label: 'Зберегти для цього платежу',
      },
      { type: 'divider' },
      {
        key: 'company',
        label: (
          <div>
            Дефолт для компанії{' '}
            <span style={{ opacity: 0.5, fontSize: '13px' }}>«{companyLabel}»</span>
          </div>
        ),
      },
      {
        key: 'domain',
        label: (
          <div>
            Дефолт для домену{' '}
            <span style={{ opacity: 0.5, fontSize: '13px' }}>«{domainName}»</span>
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

  const dropdownItems = templateItems.map((item) => ({
    key: item.key,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span
          onClick={() => handleSaveTemplate(item.key as TemplateKey)}
          style={{ display: 'flex', gap: 6 }}
        >
          {template === item.key && <CheckOutlined style={{ fontSize: 12, opacity: 0.7 }} />}
          {item.label}
        </span>
        <Dropdown
          placement={'right' as unknown as any}
          menu={makeSaveMenu(item.key as TemplateKey)}
          trigger={['hover']}
        >
          <RightOutlined style={{ fontSize: 12, opacity: 0.7 }} />
        </Dropdown>
      </div>
    ),
  }))

  const TemplateComponent = templateMap[template] || templateMap.olimp

  const companyLabelForTemplate =
    (data?.company as { companyName?: string } | undefined)?.companyName ??
    companyLabel

  const templateProps = {
    data,
    componentRef,
    isEnglish,
    currencyLabel,
    currency,
    modernInvoiceNumber,
    domainName,
    companyLabel: companyLabelForTemplate,
    rows,
    getQty,
    subtotal,
    taxPercent,
    taxAmount,
    total,
    paymentInfoLines,
    issuedToLines,
    normalizedBankDetailsLines,
  }

  return (
    <>
      <Tooltip title="Друк">
  <PrinterOutlined className={s.print} onClick={handlePrint} />
</Tooltip>
      <Dropdown
        trigger={['click']}
        placement="bottomLeft"
        menu={{
          items: dropdownItems,
          style: { minWidth: 240 },
        }}
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
          onClick={() =>
            setShowQuantityInPreview(!showQuantityInPreview)
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setShowQuantityInPreview(!showQuantityInPreview)
            }
          }}
        />
      </Tooltip>

      <TemplateComponent {...templateProps} />
    </>
  )
}

export default GroupedReceiptForm