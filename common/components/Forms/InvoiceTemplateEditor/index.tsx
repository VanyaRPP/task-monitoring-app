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
import { useEffect, useRef, useState } from 'react'
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
  registerSaver?: (fn: (() => Promise<string | null>) | null) => void
  showBaseSelector?: boolean
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
  registerSaver,
  showBaseSelector = true,
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
  // Tracks whether the draft diverges from the saved template, so auto-save
  // only writes when there is something to write.
  const [dirty, setDirty] = useState(false)

  // Re-seed the draft when the edited template's identity changes *after* mount.
  // A freshly saved copy often resolves only after the list refetch (or after a
  // non-batched parent update), which would otherwise leave the editor stuck on
  // the mount-time classic fallback. Keyed on _id (+ base for builtin switches)
  // so refetches of the same template don't clobber live edits.
  useEffect(() => {
    setName(existingTemplate?.name ?? defaultName ?? 'Новий шаблон')
    setBase(existingTemplate?.baseTemplateKey ?? baseTemplateKey)
    setProviderDesc(
      existingTemplate?.providerDescription ?? baseProviderDescription
    )
    setReceiverDesc(
      existingTemplate?.receiverDescription ?? baseReceiverDescription
    )
    setOverrides(existingTemplate?.overrides ?? {})
    setSaveMode(
      existingTemplate && !existingTemplate.isBuiltIn ? 'update' : 'new'
    )
    setDirty(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingTemplate?._id, baseTemplateKey])

  const patchOverrides = (patch: Partial<IInvoiceTemplateOverrides>) => {
    setDirty(true)
    setOverrides((prev) => ({ ...prev, ...patch }))
  }
  const patchLocalized = (
    field: 'invoiceTitle' | 'footerText',
    value: string
  ) => {
    setDirty(true)
    setOverrides((prev) => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value },
    }))
  }

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
          setDirty(true)
          return setProviderDesc(value)
        case 'receiverDescription':
          setDirty(true)
          return setReceiverDesc(value)
      }
    },
    getLabel: (key: string) => overrides.labels?.[key]?.[lang],
    setLabel: (key: string, value: string) => {
      setDirty(true)
      setOverrides((prev) => ({
        ...prev,
        labels: {
          ...prev.labels,
          [key]: { ...prev.labels?.[key], [lang]: value },
        },
      }))
    },
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

  // Single persistence path (update existing custom vs create new/copy),
  // returning the saved template so both the button and auto-save can reuse it.
  const persist = async (): Promise<IInvoiceTemplate | null> => {
    if (!domainId) {
      message.error('Не вдалося визначити домен')
      return null
    }
    if (saveMode === 'update' && isCustom && existingTemplate) {
      const result = await updateInvoiceTemplate({
        _id: existingTemplate._id,
        name: name.trim() || existingTemplate.name,
        baseTemplateKey: base,
        providerDescription: providerDesc,
        receiverDescription: receiverDesc,
        overrides,
      })
      if ('data' in result) return result.data.data
      message.error('Помилка оновлення шаблону')
      return null
    }
    const trimmedName = name.trim()
    if (!trimmedName) {
      message.error('Введіть назву шаблону')
      return null
    }
    const result = await createInvoiceTemplate({
      name: trimmedName,
      baseTemplateKey: base,
      providerDescription: providerDesc,
      receiverDescription: receiverDesc,
      overrides,
      domainId,
    })
    if ('data' in result) return result.data.data
    message.error('Помилка збереження шаблону')
    return null
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const saved = await persist()
      if (!saved) return
      setDirty(false)
      message.success(
        saveMode === 'update' && isCustom
          ? 'Шаблон оновлено'
          : `Шаблон «${saved.name}» збережено`
      )
      onSaved?.(saved)
    } finally {
      setIsSaving(false)
    }
  }

  // Called by the payment modal on invoice save: persist only when the draft
  // changed, and hand back the resulting id (the host sets it as the payment's
  // template). No message/onSaved here — the modal owns the follow-up.
  const saveIfDirty = async (): Promise<string | null> => {
    if (!dirty) return null
    const saved = await persist()
    if (!saved) return null
    setDirty(false)
    return saved._id
  }

  // Register a stable wrapper that always calls the latest saveIfDirty closure.
  const saveIfDirtyRef = useRef(saveIfDirty)
  saveIfDirtyRef.current = saveIfDirty
  useEffect(() => {
    if (!registerSaver) return
    registerSaver(() => saveIfDirtyRef.current())
    return () => registerSaver(null)
  }, [registerSaver])

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
            onChange={(e) => {
              setDirty(true)
              setName(e.target.value)
            }}
            placeholder="Назва шаблону"
            className={s.nameInput}
          />
          {showBaseSelector && (
            <Tooltip title="Базовий макет">
              <Select
                value={base}
                onChange={(v) => {
                  setDirty(true)
                  setBase(v)
                }}
                options={builtinTemplateItems.map((t) => ({
                  value: t.key,
                  label: t.label,
                }))}
                className={s.baseSelect}
              />
            </Tooltip>
          )}
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
