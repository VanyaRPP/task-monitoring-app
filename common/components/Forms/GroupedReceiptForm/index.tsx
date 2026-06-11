import {
  IExtendedPayment,
  TemplateScope,
} from '@common/api/paymentApi/payment.api.types'
import { useEditPaymentMutation } from '@common/api/paymentApi/payment.api'
import {
  useGetInvoiceTemplatesQuery,
  useCreateInvoiceTemplateMutation,
  useUpdateInvoiceTemplateMutation,
} from '@common/api/invoiceTemplateApi/invoiceTemplate.api'
import { usePaymentContext } from '@components/AddPaymentModal'
import { useInvoiceCurrency } from '@modules/hooks/useInvoiceCurrency'
import { TemplateKey } from '@components/AddPaymentModal/resolveTemplate'
import { FC, useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { useReceiptTemplateProps } from './useReceiptTemplateProps'
import {
  PrinterOutlined,
  LayoutOutlined,
  RightOutlined,
  CheckOutlined,
  TableOutlined,
  EditOutlined,
} from '@ant-design/icons'
import {
  Button,
  Dropdown,
  Form,
  Input,
  Modal,
  Radio,
  Tooltip,
  message,
  MenuProps,
} from 'antd'
import s from './style.module.scss'
import { templateMap } from './templateMap'
import InvoiceLanguageSelector from './InvoiceLanguageSelector'

const builtinTemplateItems = [
  { key: 'classic', label: 'Класичний шаблон' },
  { key: 'olimp', label: 'OLIMP DIGITAL OÜ' },
  { key: 'ledger', label: 'Formal Ledger' },
  { key: 'official', label: 'Official Invoice' },
]

const builtinLabels: Record<string, string> = {
  classic: 'Класичний шаблон',
  olimp: 'OLIMP DIGITAL OÜ',
  ledger: 'Formal Ledger',
  official: 'Official Invoice',
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
  const [createInvoiceTemplate] = useCreateInvoiceTemplateMutation()
  const [updateInvoiceTemplate] = useUpdateInvoiceTemplateMutation()
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

  const domainId: string =
    (typeof data?.domain === 'object' ? data?.domain?._id : data?.domain) ||
    (typeof company?.domain === 'object'
      ? (company.domain as any)?._id
      : company?.domain) ||
    ''

  const { data: customTemplatesRes } = useGetInvoiceTemplatesQuery(
    { domainId },
    { skip: !domainId }
  )
  const customTemplates = customTemplatesRes?.data ?? []

  const isCustomTemplate = !(template in templateMap)
  const currentCustomTemplate = isCustomTemplate
    ? customTemplates.find((t) => t._id === template) ?? null
    : null

  const [descriptionOverrides, setDescriptionOverrides] = useState<{
    providerDescription?: string
    receiverDescription?: string
  }>({})

  useEffect(() => {
    if (isCustomTemplate && currentCustomTemplate) {
      setDescriptionOverrides({
        providerDescription: currentCustomTemplate.providerDescription,
        receiverDescription: currentCustomTemplate.receiverDescription,
      })
    } else if (!isCustomTemplate) {
      setDescriptionOverrides({})
    }
  }, [template, currentCustomTemplate, isCustomTemplate])

  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [localProviderDesc, setLocalProviderDesc] = useState('')
  const [localReceiverDesc, setLocalReceiverDesc] = useState('')

  const [saveMode, setSaveMode] = useState<'new' | 'update'>('new')
  const [newTemplateName, setNewTemplateName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const rawProviderDescFromData: string =
    (typeof data?.domain === 'object' ? data?.domain?.description : '') ||
    (typeof company?.domain === 'object'
      ? (company.domain as any)?.description
      : '') ||
    ''
  const rawReceiverDescFromData: string = data?.reciever?.description || ''

  const activeOverrides = isEditingDesc
    ? { providerDescription: localProviderDesc, receiverDescription: localReceiverDesc }
    : descriptionOverrides

  const effectiveData = data
    ? {
        ...data,
        provider: {
          ...data.provider,
          description:
            activeOverrides.providerDescription !== undefined
              ? activeOverrides.providerDescription
              : data?.provider?.description,
        },
        reciever: {
          ...data.reciever,
          description:
            activeOverrides.receiverDescription !== undefined
              ? activeOverrides.receiverDescription
              : data?.reciever?.description,
        },
      }
    : data

  const receiptProps = useReceiptTemplateProps({
    data: effectiveData,
    contextCompany: company,
    lang: invoiceLang,
    descriptionOverrides: activeOverrides,
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
    overrides,
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

  const handleToggleDescEdit = () => {
    if (isEditingDesc) {
      setIsEditingDesc(false)
      return
    }
    const initProvider =
      descriptionOverrides.providerDescription !== undefined
        ? descriptionOverrides.providerDescription
        : rawProviderDescFromData
    const initReceiver =
      descriptionOverrides.receiverDescription !== undefined
        ? descriptionOverrides.receiverDescription
        : rawReceiverDescFromData

    setLocalProviderDesc(initProvider)
    setLocalReceiverDesc(initReceiver)

    const defaultMode: 'new' | 'update' = isCustomTemplate ? 'update' : 'new'
    setSaveMode(defaultMode)

    const currentLabel = isCustomTemplate
      ? (currentCustomTemplate?.name || template)
      : (builtinLabels[template] || template)
    setNewTemplateName(`Copy - ${currentLabel}`)

    setIsEditingDesc(true)
  }

  const handleCancelDescEdit = () => {
    setIsEditingDesc(false)
  }

  const hasDescChanges = (() => {
    const baseProvider =
      descriptionOverrides.providerDescription !== undefined
        ? descriptionOverrides.providerDescription
        : rawProviderDescFromData
    const baseReceiver =
      descriptionOverrides.receiverDescription !== undefined
        ? descriptionOverrides.receiverDescription
        : rawReceiverDescFromData
    return (
      localProviderDesc !== baseProvider || localReceiverDesc !== baseReceiver
    )
  })()

  const handleConfirmSave = async () => {
    if (!domainId) {
      message.error('Не вдалося визначити домен')
      return
    }
    setIsSaving(true)
    try {
      if (saveMode === 'new') {
        const trimmedName = newTemplateName.trim()
        if (!trimmedName) {
          message.error('Введіть назву шаблону')
          return
        }
        const baseKey = isCustomTemplate
          ? (currentCustomTemplate?.baseTemplateKey || 'classic')
          : template
        const result = await createInvoiceTemplate({
          name: trimmedName,
          baseTemplateKey: baseKey,
          providerDescription: localProviderDesc,
          receiverDescription: localReceiverDesc,
          domainId,
        })
        if ('data' in result) {
          const newId = result.data.data._id
          setTemplate(newId as TemplateKey)
          setDescriptionOverrides({
            providerDescription: localProviderDesc,
            receiverDescription: localReceiverDesc,
          })
          message.success(`Новий шаблон «${trimmedName}» збережено`)
          setIsEditingDesc(false)
        } else {
          message.error('Помилка збереження шаблону')
        }
      } else {
        const result = await updateInvoiceTemplate({
          _id: template,
          providerDescription: localProviderDesc,
          receiverDescription: localReceiverDesc,
        })
        if ('data' in result) {
          setDescriptionOverrides({
            providerDescription: localProviderDesc,
            receiverDescription: localReceiverDesc,
          })
          message.success('Шаблон оновлено')
          setIsEditingDesc(false)
        } else {
          message.error('Помилка оновлення шаблону')
        }
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleRenameConfirm = async () => {
    if (!renameTarget || !renameValue.trim()) return
    setIsSaving(true)
    try {
      const result = await updateInvoiceTemplate({
        _id: renameTarget.id,
        name: renameValue.trim(),
      })
      if ('data' in result) {
        message.success('Назву шаблону змінено')
        setRenameModalOpen(false)
        setRenameTarget(null)
      } else {
        message.error('Помилка перейменування')
      }
    } finally {
      setIsSaving(false)
    }
  }

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

  const makeCustomTemplateMenu = (
    templateId: string,
    templateName: string
  ): MenuProps => ({
    items: [{ key: 'rename', label: 'Перейменувати' }],
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation()
      if (key === 'rename') {
        setRenameTarget({ id: templateId, name: templateName })
        setRenameValue(templateName)
        setRenameModalOpen(true)
      }
    },
  })

  const builtinDropdownItems = builtinTemplateItems.map((item) => ({
    key: item.key,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            style={{ fontSize: 12, opacity: 0.7, padding: '0 8px', cursor: 'pointer' }}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </div>
    ),
  }))

  const customDropdownItems = customTemplates.map((ct) => ({
    key: ct._id,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          onClick={() => handleSaveTemplate(ct._id as TemplateKey)}
          style={{ display: 'flex', gap: 6, width: '100%' }}
        >
          {template === ct._id && (
            <CheckOutlined style={{ fontSize: 12, opacity: 0.7 }} />
          )}
          <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ct.name}
          </span>
        </span>
        <Dropdown
          placement={'right' as unknown as any}
          menu={makeCustomTemplateMenu(ct._id, ct.name)}
          trigger={['click']}
        >
          <RightOutlined
            style={{ fontSize: 12, opacity: 0.7, padding: '0 8px', cursor: 'pointer' }}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </div>
    ),
  }))

  const dropdownItems = [
    ...builtinDropdownItems,
    ...(customTemplates.length > 0
      ? [{ type: 'divider' as const }, ...customDropdownItems]
      : []),
  ]

  const baseTemplateKey = isCustomTemplate
    ? (currentCustomTemplate?.baseTemplateKey || 'classic')
    : template
  const TemplateComponent = templateMap[baseTemplateKey] || templateMap.olimp

  const templateProps = {
    data: effectiveData,
    componentRef,
    isEnglish,
    invoiceLang,
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
    editMode: isEditingDesc,
    rawProviderDesc: localProviderDesc,
    rawReceiverDesc: localReceiverDesc,
    onProviderDescChange: setLocalProviderDesc,
    onReceiverDescChange: setLocalReceiverDesc,
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

      <Tooltip title={isEditingDesc ? 'Закрити редагування описів' : 'Редагувати описи'}>
        <EditOutlined
          className={`${s.descEdit} ${isEditingDesc ? s.descEditActive : ''}`}
          onClick={handleToggleDescEdit}
        />
      </Tooltip>

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
        <InvoiceLanguageSelector lang={invoiceLang} onChange={handleSaveLanguage} />
      </span>

      <TemplateComponent {...templateProps} />

      {/* Inline save bar — appears below the template when editing */}
      {isEditingDesc && (
        <div className={s.saveBar}>
          <div className={s.saveBarOptions}>
            {isCustomTemplate ? (
              <Radio.Group
                value={saveMode}
                onChange={(e) => setSaveMode(e.target.value)}
                className={s.saveBarRadio}
              >
                <Radio value="update">
                  Оновити{' '}
                  <span className={s.saveBarTemplateName}>
                    «{currentCustomTemplate?.name}»
                  </span>
                </Radio>
                <Radio value="new">Новий шаблон</Radio>
              </Radio.Group>
            ) : (
              <span className={s.saveBarInfo}>Буде створено новий шаблон</span>
            )}

            {(saveMode === 'new' || !isCustomTemplate) && (
              <Input
                size="small"
                placeholder="Назва шаблону"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className={s.saveBarInput}
              />
            )}
          </div>

          <div className={s.saveBarActions}>
            <Button size="small" onClick={handleCancelDescEdit} disabled={isSaving}>
              Скасувати
            </Button>
            <Button
              size="small"
              type="primary"
              loading={isSaving}
              disabled={!hasDescChanges}
              onClick={handleConfirmSave}
            >
              Зберегти
            </Button>
          </div>
        </div>
      )}

      {/* Rename custom template modal */}
      <Modal
        title="Перейменувати шаблон"
        open={renameModalOpen}
        onCancel={() => setRenameModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setRenameModalOpen(false)}>
            Скасувати
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={isSaving}
            onClick={handleRenameConfirm}
          >
            Зберегти
          </Button>,
        ]}
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          placeholder="Назва шаблону"
        />
      </Modal>
    </>
  )
}

export default GroupedReceiptForm
