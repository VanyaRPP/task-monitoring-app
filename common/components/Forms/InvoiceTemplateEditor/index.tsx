import {
  useCreateInvoiceTemplateMutation,
  useUpdateInvoiceTemplateMutation,
} from '@common/api/invoiceTemplateApi/invoiceTemplate.api'
import {
  IInvoiceTemplate,
  IInvoiceTemplateOverrides,
} from '@common/api/invoiceTemplateApi/invoiceTemplate.api.types'
import { builtinTemplateItems } from '@components/Forms/GroupedReceiptForm/builtinTemplates'
import { templateMap } from '@components/Forms/GroupedReceiptForm/templateMap'
import { useReceiptTemplateProps } from '@components/Forms/GroupedReceiptForm/useReceiptTemplateProps'
import { applyDescriptionOverrides } from '@components/Forms/GroupedReceiptForm/applyDescriptionOverrides'
import {
  EditableValuePath,
  InvoiceEditContext,
} from '@components/Forms/GroupedReceiptForm/InvoiceEditContext'
import { Button, Input, Radio, Select, Tooltip, message } from 'antd'
import { useRef, useState } from 'react'
import s from './style.module.scss'

interface Props {
  domainId: string
  /** Custom template being edited; null/undefined => creating from a base layout */
  existingTemplate?: IInvoiceTemplate | null
  /** Initial base layout (built-in key) when not editing a custom template */
  baseTemplateKey?: string
  /** Base descriptions to seed when no custom template is selected */
  baseProviderDescription?: string
  baseReceiverDescription?: string
  /** Payment-like data for the editable canvas; a sample is used when absent */
  previewData?: any
  contextCompany?: any
  previewLang?: 'en' | 'uk'
  /** Suggested name for a brand-new template */
  defaultName?: string
  onSaved?: (template: IInvoiceTemplate) => void
  onCancel?: () => void
}

const SAMPLE_PREVIEW = {
  invoiceNumber: 1001,
  invoiceCreationDate: new Date().toISOString(),
  generalSum: 1000,
  currency: 'UAH',
  invoice: [
    { type: 'maintenancePrice', name: 'Послуга', sum: 1000, amount: 1 },
  ],
  provider: { description: '' },
  reciever: { description: '', companyName: 'ТОВ «Приклад»' },
}

const InvoiceTemplateEditor = ({
  domainId,
  existingTemplate = null,
  baseTemplateKey = 'classic',
  baseProviderDescription = '',
  baseReceiverDescription = '',
  previewData,
  contextCompany,
  previewLang = 'uk',
  defaultName,
  onSaved,
  onCancel,
}: Props) => {
  const [createInvoiceTemplate] = useCreateInvoiceTemplateMutation()
  const [updateInvoiceTemplate] = useUpdateInvoiceTemplateMutation()

  const isCustom = !!existingTemplate && !existingTemplate.isBuiltIn

  const [name, setName] = useState(
    existingTemplate?.name ?? defaultName ?? 'Новий шаблон'
  )
  const [base, setBase] = useState(
    existingTemplate?.baseTemplateKey ?? baseTemplateKey
  )
  const [providerDesc, setProviderDesc] = useState(
    existingTemplate?.providerDescription ?? baseProviderDescription
  )
  const [receiverDesc, setReceiverDesc] = useState(
    existingTemplate?.receiverDescription ?? baseReceiverDescription
  )
  const [overrides, setOverrides] = useState<IInvoiceTemplateOverrides>(
    existingTemplate?.overrides ?? {}
  )
  const [lang, setLang] = useState<'en' | 'uk'>(previewLang)

  const [saveMode, setSaveMode] = useState<'new' | 'update'>(
    isCustom ? 'update' : 'new'
  )
  const [isSaving, setIsSaving] = useState(false)

  const patchOverrides = (patch: Partial<IInvoiceTemplateOverrides>) =>
    setOverrides((prev) => ({ ...prev, ...patch }))
  const patchLocalized = (
    field: 'invoiceTitle' | 'footerText',
    value: string
  ) =>
    setOverrides((prev) => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value },
    }))

  // Inline-editing channel consumed by <EditableText> inside the template.
  const editCtx = {
    editMode: true,
    lang,
    getValue: (path: EditableValuePath) => {
      switch (path) {
        case 'invoiceTitle':
          return overrides.invoiceTitle?.[lang]
        case 'footerText':
          return overrides.footerText?.[lang]
        case 'providerDescription':
          return providerDesc
        case 'receiverDescription':
          return receiverDesc
      }
    },
    setValue: (path: EditableValuePath, value: string) => {
      switch (path) {
        case 'invoiceTitle':
          return patchLocalized('invoiceTitle', value)
        case 'footerText':
          return patchLocalized('footerText', value)
        case 'providerDescription':
          return setProviderDesc(value)
        case 'receiverDescription':
          return setReceiverDesc(value)
      }
    },
    getLabel: (key: string) => overrides.labels?.[key]?.[lang],
    setLabel: (key: string, value: string) =>
      setOverrides((prev) => ({
        ...prev,
        labels: {
          ...prev.labels,
          [key]: { ...prev.labels?.[key], [lang]: value },
        },
      })),
  }

  const previewBase = previewData ?? SAMPLE_PREVIEW
  const canvasData = applyDescriptionOverrides(previewBase, {
    providerDescription: providerDesc,
    receiverDescription: receiverDesc,
  })

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const receiptProps = useReceiptTemplateProps({
    data: canvasData,
    contextCompany,
    lang,
    descriptionOverrides: {
      providerDescription: providerDesc,
      receiverDescription: receiverDesc,
    },
    overrides,
  })
  const TemplateComponent = templateMap[base] || templateMap.classic

  const handleSave = async () => {
    if (!domainId) {
      message.error('Не вдалося визначити домен')
      return
    }
    setIsSaving(true)
    try {
      if (saveMode === 'update' && isCustom && existingTemplate) {
        const result = await updateInvoiceTemplate({
          _id: existingTemplate._id,
          name: name.trim() || existingTemplate.name,
          baseTemplateKey: base,
          providerDescription: providerDesc,
          receiverDescription: receiverDesc,
          overrides,
        })
        if ('data' in result) {
          message.success('Шаблон оновлено')
          onSaved?.(result.data.data)
        } else {
          message.error('Помилка оновлення шаблону')
        }
      } else {
        const trimmedName = name.trim()
        if (!trimmedName) {
          message.error('Введіть назву шаблону')
          return
        }
        const result = await createInvoiceTemplate({
          name: trimmedName,
          baseTemplateKey: base,
          providerDescription: providerDesc,
          receiverDescription: receiverDesc,
          overrides,
          domainId,
        })
        if ('data' in result) {
          message.success(`Шаблон «${trimmedName}» збережено`)
          onSaved?.(result.data.data)
        } else {
          message.error('Помилка збереження шаблону')
        }
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={s.editor}>
      <div className={s.toolbar}>
        <div className={s.actions}>
          {onCancel && (
            <Button onClick={onCancel} disabled={isSaving}>
              Скасувати
            </Button>
          )}
          <Button type="primary" loading={isSaving} onClick={handleSave}>
            Зберегти
          </Button>
          {isCustom && (
            <Radio.Group
              size="small"
              value={saveMode}
              onChange={(e) => setSaveMode(e.target.value)}
            >
              <Radio.Button value="update">Оновити</Radio.Button>
              <Radio.Button value="new">Новий</Radio.Button>
            </Radio.Group>
          )}
        </div>

        <div className={s.settings}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Назва шаблону"
            className={s.nameInput}
          />
          <Select
            value={base}
            onChange={setBase}
            options={builtinTemplateItems.map((t) => ({
              value: t.key,
              label: t.label,
            }))}
            className={s.baseSelect}
          />
          <Tooltip title="Акцентний колір">
            <span className={s.colorWrap}>
              <input
                type="color"
                value={overrides.accentColor || '#000000'}
                onChange={(e) =>
                  patchOverrides({ accentColor: e.target.value })
                }
                className={s.colorInput}
              />
              {!!overrides.accentColor && (
                <Button
                  type="text"
                  size="small"
                  onClick={() => patchOverrides({ accentColor: undefined })}
                >
                  ✕
                </Button>
              )}
            </span>
          </Tooltip>
          <Radio.Group
            size="small"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            <Radio.Button value="uk">UA</Radio.Button>
            <Radio.Button value="en">EN</Radio.Button>
          </Radio.Group>
        </div>
      </div>

      <div className={s.canvas}>
        <InvoiceEditContext.Provider value={editCtx}>
          <TemplateComponent
            {...receiptProps}
            componentRef={canvasRef}
            invoiceLang={lang}
          />
        </InvoiceEditContext.Provider>
      </div>
    </div>
  )
}

export default InvoiceTemplateEditor
