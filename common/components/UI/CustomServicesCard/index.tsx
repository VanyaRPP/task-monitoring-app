import { CSSProperties, FC, useEffect, useMemo, useRef, useState } from 'react'
import {
  Input,
  InputNumber,
  Space,
  Button,
  Form,
  Select,
  Tooltip,
  theme,
} from 'antd'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { inputNumberParser, isAdminCheck } from '@utils/helpers'
import { ServiceType } from '@utils/constants'
import {
  CloseOutlined,
  CheckOutlined,
  FileTextOutlined,
  UpOutlined,
} from '@ant-design/icons'
import s from './style.module.scss'

type CustomServicesCardProps = {
  form: any
  disabled?: boolean
  allCustomServices?: any[]
  isServiceForm?: boolean
  skipAutoPopulate?: boolean
}

const CustomServicesCard: FC<CustomServicesCardProps> = ({
  form,
  disabled = false,
  allCustomServices = [],
  isServiceForm = false,
  skipAutoPopulate = false,
}) => {
  const { token } = theme.useToken()
  const { data: user } = useGetCurrentUserQuery()
  const isAdmin = useMemo(() => isAdminCheck(user?.roles), [user])

  const watchedCustomServices = Form.useWatch('customServices', form)
  const customServices = useMemo(
    () => watchedCustomServices || [],
    [watchedCustomServices]
  )
  const selectedIds: string[] = customServices.map((s: any) => s._id)

  const [lastClickedId, setLastClickedId] = useState<string | null>(null)
  const shiftPressedRef = useRef(false)

  const [openNoteIds, setOpenNoteIds] = useState<Set<string>>(() => new Set())
  const [justOpenedNoteId, setJustOpenedNoteId] = useState<string | null>(null)
  const autoOpenedNoteIdsRef = useRef<Set<string>>(new Set())

  const noteCssVars = useMemo(
    () =>
      ({
        '--note-border': token.colorBorder,
        '--note-border-hover': token.colorPrimaryHover,
        '--note-border-focus': token.colorPrimary,
        '--note-focus-shadow': token.controlOutline,
        '--note-addon-bg': token.colorFillSecondary,
        '--note-input-bg': token.colorBgContainer,
        '--note-text': token.colorText,
        '--note-radius': `${token.borderRadius}px`,
        '--note-error-color': token.colorError,
      }) as CSSProperties,
    [token]
  )

  const buildEntry = (service: any) => ({
    _id: service?._id,
    label: service?.label,
    fieldName: service?.fieldName,
    price: null,
  })

  // Persist the company's services together with the "all services" flag. The
  // flag mirrors whether every domain service is currently selected — it is the
  // signal the backend uses to decide if a newly added domain service should be
  // auto-cascaded to this company. Service forms don't own this flag.
  const commitServices = (next: any[]) => {
    form.setFieldValue('customServices', next)
    if (!isServiceForm) {
      form.setFieldValue(
        'allServices',
        allCustomServices.length > 0 && next.length === allCustomServices.length
      )
    }
  }

  const applyIds = (ids: string[]) => {
    const uniqueIds = Array.from(new Set(ids))
    const next = uniqueIds.map((id) => {
      const existing = customServices.find((s: any) => s._id === id)
      if (existing) return existing
      const source = allCustomServices.find((s) => s?._id === id)
      return buildEntry(source)
    })
    commitServices(next)
  }

  const handleSelectChange = (ids: string[]) => {
    if (shiftPressedRef.current && lastClickedId) {
      const added = ids.find((id) => !selectedIds.includes(id))
      if (added) {
        const fromIdx = allCustomServices.findIndex(
          (s) => s?._id === lastClickedId
        )
        const toIdx = allCustomServices.findIndex((s) => s?._id === added)
        if (fromIdx !== -1 && toIdx !== -1) {
          const [start, end] = [
            Math.min(fromIdx, toIdx),
            Math.max(fromIdx, toIdx),
          ]
          const rangeIds = allCustomServices
            .slice(start, end + 1)
            .map((s) => s?._id)
          applyIds([...selectedIds, ...rangeIds])
          setLastClickedId(added)
          return
        }
      }
    }

    const added = ids.find((id) => !selectedIds.includes(id))
    if (added) setLastClickedId(added)
    applyIds(ids)
  }

  const allSelected =
    allCustomServices.length > 0 &&
    selectedIds.length === allCustomServices.length

  const handleToggleAll = () => {
    if (allSelected) {
      applyIds([])
      setLastClickedId(null)
    } else {
      applyIds(allCustomServices.map((s) => s?._id))
    }
  }

  const selectOptions = allCustomServices.map((s) => ({
    value: s?._id,
    label: s?.label,
  }))

  const handleRemoveService = (index: number) => {
    const removed = customServices[index]
    const removedKey = removed?._id ? String(removed._id) : null
    if (removedKey) {
      autoOpenedNoteIdsRef.current.delete(removedKey)
      setOpenNoteIds((prev) => {
        if (!prev.has(removedKey)) return prev
        const next = new Set(prev)
        next.delete(removedKey)
        return next
      })
    }
    const updated = [...customServices]
    updated.splice(index, 1)
    commitServices(updated)
  }

  const handleOpenNote = (serviceKey: string) => {
    autoOpenedNoteIdsRef.current.add(serviceKey)
    setOpenNoteIds((prev) => {
      const next = new Set(prev)
      next.add(serviceKey)
      return next
    })
    setJustOpenedNoteId(serviceKey)
  }

  const handleCloseNote = (serviceKey: string) => {
    autoOpenedNoteIdsRef.current.add(serviceKey)
    setOpenNoteIds((prev) => {
      if (!prev.has(serviceKey)) return prev
      const next = new Set(prev)
      next.delete(serviceKey)
      return next
    })
    setJustOpenedNoteId((prev) => (prev === serviceKey ? null : prev))
  }

  const dashIfEmpty = (v: any) => (v === 0 || v ? v : '-')

  const autoPopulatedRef = useRef(false)

  useEffect(() => {
    if (isServiceForm) return
    const toOpen: string[] = []
    for (const service of customServices) {
      const id = service?._id ? String(service._id) : ''
      if (!id || autoOpenedNoteIdsRef.current.has(id)) continue
      if (typeof service?.note === 'string' && service.note.trim()) {
        autoOpenedNoteIdsRef.current.add(id)
        toOpen.push(id)
      }
    }
    if (toOpen.length > 0) {
      setOpenNoteIds((prev) => {
        const next = new Set(prev)
        toOpen.forEach((id) => next.add(id))
        return next
      })
    }
  }, [customServices, isServiceForm])

  useEffect(() => {
    if (skipAutoPopulate || disabled) return
    if (autoPopulatedRef.current) return
    if (allCustomServices.length === 0) return

    if (customServices.length > 0) {
      autoPopulatedRef.current = true
      return
    }

    commitServices(allCustomServices.map(buildEntry))
    autoPopulatedRef.current = true
    // Runs once (guarded by autoPopulatedRef); commitServices is stable enough
    // for this one-shot population.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allCustomServices,
    customServices.length,
    disabled,
    form,
    skipAutoPopulate,
  ])

  return (
    <div style={noteCssVars}>
      {!disabled && !isServiceForm && (
        <Tooltip
          title={
            allCustomServices.length === 0
              ? 'У обраного домена відсутні послуги'
              : ''
          }
          placement="top"
        >
          <Select
            mode="multiple"
            placeholder="Індивідуальні послуги"
            value={selectedIds}
            onChange={handleSelectChange}
            options={selectOptions}
            disabled={allCustomServices.length === 0}
            style={{ width: '100%', marginBottom: 16 }}
            maxTagCount="responsive"
            optionFilterProp="label"
            onKeyDown={(e) => {
              shiftPressedRef.current = e.shiftKey
            }}
            onKeyUp={(e) => {
              shiftPressedRef.current = e.shiftKey
            }}
            onMouseDown={(e) => {
              shiftPressedRef.current = e.shiftKey
            }}
            popupRender={(menu) => (
              <>
                <Button
                  type="text"
                  block
                  icon={allSelected ? <CheckOutlined /> : null}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleToggleAll}
                >
                  {allSelected ? 'Скасувати вибір' : 'Обрати всі'}
                </Button>
                {menu}
              </>
            )}
          />
        </Tooltip>
      )}

      <Form.List name="customServices">
        {(fields) => (
          <>
            {fields.map((field, index) => {
              const service = customServices[index]

              if (isServiceForm) {
                return (
                  <Space
                    key={field.key}
                    style={{
                      width: '100%',
                      display: 'grid',
                      gridTemplateColumns: disabled ? '1fr' : '1fr auto',
                      columnGap: 8,
                      marginBottom: 6,
                      marginTop: 6,
                    }}
                    align="start"
                  >
                    <Form.Item
                      name={[field.name, 'price']}
                      label={service?.label}
                      rules={
                        service?.fieldName === ServiceType.Inflicion
                          ? []
                          : [{ required: true, message: 'Введіть значення' }]
                      }
                      style={{ width: '100%' }}
                      getValueProps={(v) =>
                        disabled ? { value: dashIfEmpty(v) } : { value: v }
                      }
                    >
                      <InputNumber
                        parser={inputNumberParser}
                        placeholder="Введіть значення"
                        style={{
                          width: disabled ? '100%' : 470,
                        }}
                        disabled={disabled}
                      />
                    </Form.Item>
                  </Space>
                )
              }

              const serviceKey = String(service?._id ?? field.key)
              const hasNote = Boolean(
                typeof service?.note === 'string' && service.note.trim()
              )
              const isNoteOpen = disabled
                ? hasNote
                : openNoteIds.has(serviceKey)
              const isPriceRequired = !hasNote
              const rowGridClass = disabled ? s.rowGridDisabled : s.rowGrid

              return (
                <div key={field.key} className={s.serviceBlock}>
                  <div className={`${rowGridClass} ${s.headerRow}`}>
                    {isNoteOpen ? (
                      <div
                        className={`${s.noteGroup} ${
                          disabled ? s.noteGroupDisabled : ''
                        }`}
                        data-testid={`note-group-${service?.label}`}
                      >
                        <Tooltip title={service?.label}>
                          <div className={s.noteAddon}>
                            {!disabled && isPriceRequired && (
                              <span className={s.requiredMark}>*</span>
                            )}
                            <span className={s.noteAddonLabel}>
                              {service?.label}
                            </span>
                          </div>
                        </Tooltip>
                        <div className={s.noteInputWrap}>
                          <Form.Item name={[field.name, 'note']} noStyle>
                            <Input.TextArea
                              variant="borderless"
                              autoSize={{ minRows: 1, maxRows: 6 }}
                              maxLength={2000}
                              allowClear={!disabled}
                              autoFocus={justOpenedNoteId === serviceKey}
                              placeholder="Примітка"
                              disabled={disabled}
                              data-testid={`note-${service?.label}`}
                            />
                          </Form.Item>
                        </div>
                      </div>
                    ) : (
                      <div className={s.labelRow}>
                        <span className={s.labelText}>
                          {!disabled && isPriceRequired && (
                            <span className={s.requiredMark}>*</span>
                          )}
                          <span>{service?.label}</span>
                          {!disabled && (
                            <Tooltip
                              title={
                                hasNote
                                  ? 'Редагувати внутрішню примітку'
                                  : 'Додати внутрішню примітку'
                              }
                            >
                              <Button
                                type="text"
                                size="small"
                                icon={<FileTextOutlined />}
                                onClick={() => handleOpenNote(serviceKey)}
                                data-testid={`toggle-note-${service?.label}`}
                                aria-label={`Примітка для ${service?.label}`}
                                className={s.noteToggleBtn}
                                style={{
                                  color: hasNote
                                    ? '#722ed1'
                                    : token.colorTextSecondary,
                                }}
                              >
                                Примітка
                              </Button>
                            </Tooltip>
                          )}
                        </span>
                        <Form.Item name={[field.name, 'note']} hidden>
                          <Input />
                        </Form.Item>
                      </div>
                    )}

                    {!disabled && (
                      <div className={s.actionSlot}>
                        {isNoteOpen && (
                          <Tooltip title="Згорнути примітку">
                            <Button
                              type="text"
                              size="small"
                              icon={<UpOutlined />}
                              onClick={() => handleCloseNote(serviceKey)}
                              data-testid={`collapse-note-${service?.label}`}
                              aria-label={`Згорнути примітку для ${service?.label}`}
                            />
                          </Tooltip>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={`${rowGridClass} ${s.priceRow}`}>
                    <Form.Item
                      name={[field.name, 'price']}
                      rules={[
                        {
                          required: isPriceRequired,
                          message: 'Введіть значення',
                        },
                      ]}
                      style={{ width: '100%', marginBottom: 0 }}
                      getValueProps={(v) =>
                        disabled ? { value: dashIfEmpty(v) } : { value: v }
                      }
                    >
                      <InputNumber
                        parser={inputNumberParser}
                        placeholder="Введіть значення"
                        style={{ width: '100%' }}
                        disabled={disabled}
                      />
                    </Form.Item>
                    {!disabled && (
                      <div className={s.actionSlot}>
                        {isAdmin && (
                          <Button
                            type="text"
                            icon={<CloseOutlined />}
                            aria-label={`remove-${service?.label}`}
                            data-testid={`remove-${service?.label}`}
                            onClick={() => handleRemoveService(index)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </Form.List>
    </div>
  )
}

export default CustomServicesCard
