import { FC, useEffect, useMemo, useRef, useState } from 'react'
import {
  InputNumber,
  Space,
  Button,
  Form,
  Input,
  Select,
  Tooltip,
  Typography,
} from 'antd'
import type { InputRef, RefSelectProps } from 'antd'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { inputNumberParser, isAdminCheck } from '@utils/helpers'
import { ServiceType } from '@utils/constants'
import {
  CloseOutlined,
  CheckOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import {
  createDraftServiceEntry,
  getDraftServiceNameError,
  isDraftServiceEntry,
} from '@utils/companyServiceDrafts'
import { useSelectTabNavigation } from '@modules/hooks/useSelectTabNavigation'

type CustomServicesCardProps = {
  form: any
  disabled?: boolean
  allCustomServices?: any[]
  isServiceForm?: boolean
  skipAutoPopulate?: boolean
  allowCreateServices?: boolean
}

const CustomServicesCard: FC<CustomServicesCardProps> = ({
  form,
  disabled = false,
  allCustomServices = [],
  isServiceForm = false,
  skipAutoPopulate = false,
  allowCreateServices = false,
}) => {
  const { data: user } = useGetCurrentUserQuery()
  const isAdmin = useMemo(() => isAdminCheck(user?.roles), [user])

  const customServices = Form.useWatch('customServices', form) || []
  const selectedIds: string[] = customServices.map((s: any) => s._id)

  const draftIds: string[] = customServices
    .filter(isDraftServiceEntry)
    .map((s: any) => s._id)
  const canCreateServices =
    allowCreateServices && isAdmin && !disabled && !isServiceForm

  const [lastClickedId, setLastClickedId] = useState<string | null>(null)
  const shiftPressedRef = useRef(false)
  const [searchText, setSearchText] = useState('')
  const selectRef = useRef<RefSelectProps>(null)
  const tabNavigation = useSelectTabNavigation()
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null)
  const unconfirmedDraftIdsRef = useRef(new Set<string>())
  const labelBeforeEditRef = useRef<string>('')
  const draftNameInputRef = useRef<InputRef>(null)

  useEffect(() => {
    if (!editingDraftId) return
    draftNameInputRef.current?.focus({ cursor: 'all' })
  }, [editingDraftId])

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
      const existingCount = next.filter((s) => !isDraftServiceEntry(s)).length
      form.setFieldValue(
        'allServices',
        allCustomServices.length > 0 &&
          existingCount === allCustomServices.length
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
    setSearchText('')
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
    allCustomServices.every((s) => selectedIds.includes(s?._id))

  const handleToggleAll = () => {
    if (allSelected) {
      applyIds(draftIds)
      setLastClickedId(null)
    } else {
      applyIds([...allCustomServices.map((s) => s?._id), ...draftIds])
    }
  }

  const selectOptions = [
    ...allCustomServices.map((s) => ({ value: s?._id, label: s?.label })),
    ...customServices
      .filter(isDraftServiceEntry)
      .map((s: any) => ({ value: s._id, label: s.label })),
  ]

  const normalizedSearchText = searchText.trim().toLowerCase()

  const hasExactServiceMatch =
    normalizedSearchText.length > 0 &&
    [...allCustomServices, ...customServices.filter(isDraftServiceEntry)].some(
      (service) =>
        String(service?.label ?? '')
          .trim()
          .toLowerCase() === normalizedSearchText
    )

  const createServiceLabel =
    normalizedSearchText && !hasExactServiceMatch
      ? `Створити «${searchText.trim()}»`
      : 'Створити нову послугу'

  const handleRemoveService = (index: number) => {
    const removed = customServices[index]
    if (removed?._id === editingDraftId) setEditingDraftId(null)
    if (removed?._id) unconfirmedDraftIdsRef.current.delete(removed._id)
    const updated = [...customServices]
    updated.splice(index, 1)
    commitServices(updated)
  }

  const handleCreateDraft = (name = '') => {
    const draft = createDraftServiceEntry()
    const trimmedName = name.trim()

    if (trimmedName) {
      draft.label = trimmedName
    } else {
      unconfirmedDraftIdsRef.current.add(draft._id)
      labelBeforeEditRef.current = draft.label
      setEditingDraftId(draft._id)
    }

    commitServices([...customServices, draft])
    selectRef.current?.blur()
    setSearchText('')
  }

  const handleSelectInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key !== 'Enter' || !canCreateServices) return

    const name = searchText.trim()

    if (!name) return

    const normalizedName = name.toLowerCase()

    const hasExactMatch = [...allCustomServices, ...customServices].some(
      (service) =>
        String(service?.label ?? '')
          .trim()
          .toLowerCase() === normalizedName
    )

    if (hasExactMatch) return

    const hasMatchingOption = selectOptions.some((option) =>
      String(option.label ?? '')
        .toLowerCase()
        .includes(normalizedName)
    )
    if (hasMatchingOption) return

    e.preventDefault()
    e.stopPropagation()

    handleCreateDraft(name)
  }

  const startEditingDraft = (id: string, label: string) => {
    labelBeforeEditRef.current = label
    setEditingDraftId(id)
  }

  const draftIndexById = (id: string): number =>
    (form.getFieldValue('customServices') || []).findIndex(
      (s: any) => s?._id === id
    )

  const confirmDraftName = async (id: string) => {
    const index = draftIndexById(id)
    if (index === -1) return
    const namePath = ['customServices', index, 'label']
    try {
      await form.validateFields([namePath])
    } catch {
      return
    }
    form.setFieldValue(namePath, String(form.getFieldValue(namePath)).trim())
    unconfirmedDraftIdsRef.current.delete(id)
    setEditingDraftId(null)
  }

  const cancelDraftEditing = (id: string) => {
    const index = draftIndexById(id)
    if (index === -1) return
    if (unconfirmedDraftIdsRef.current.has(id)) {
      handleRemoveService(index)
      return
    }
    const namePath = ['customServices', index, 'label']
    form.setFieldValue(namePath, labelBeforeEditRef.current)
    form.validateFields([namePath]).catch(() => undefined)
    setEditingDraftId(null)
  }

  const validateDraftName =
    (index: number) => async (_: unknown, value: unknown) => {
      const all = form.getFieldValue('customServices') || []
      const takenNames = [
        ...allCustomServices.map((s) => String(s?.label ?? '')),
        ...all
          .filter((s: any, i: number) => i !== index && isDraftServiceEntry(s))
          .map((s: any) => String(s.label ?? '')),
      ]
      const error = getDraftServiceNameError(value, takenNames)
      if (error) throw new Error(error)
    }
  const dashIfEmpty = (v: any) => (v === 0 || v ? v : '-')

  const autoPopulatedRef = useRef(false)

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
    <div>
      {!disabled && !isServiceForm && (
        <Tooltip
          title={
            allCustomServices.length === 0
              ? 'У обраного домена відсутні послуги'
              : ''
          }
          placement="top"
        >
          <div onKeyDownCapture={tabNavigation.onKeyDownCapture}>
            <Select
              onOpenChange={tabNavigation.onOpenChange}
              mode="multiple"
              showSearch
              searchValue={searchText}
              onSearch={setSearchText}
              onInputKeyDown={handleSelectInputKeyDown}
              placeholder="Індивідуальні послуги"
              value={selectedIds}
              onChange={handleSelectChange}
              options={selectOptions}
              ref={selectRef}
              disabled={allCustomServices.length === 0 && !canCreateServices}
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
                  {canCreateServices && (
                    <Button
                      type="text"
                      block
                      icon={<PlusOutlined />}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() =>
                        handleCreateDraft(
                          normalizedSearchText && !hasExactServiceMatch
                            ? searchText.trim()
                            : ''
                        )
                      }
                    >
                      {createServiceLabel}
                    </Button>
                  )}
                </>
              )}
            />
          </div>
        </Tooltip>
      )}

      <Form.List name="customServices">
        {(fields) => (
          <>
            {fields.map((field, index) => {
              const service = customServices[index]
              const isDraft = isDraftServiceEntry(service)
              const isEditingName = isDraft && service._id === editingDraftId
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
                  <div>
                    {isDraft && (
                      <Form.Item
                        name={[field.name, 'label']}
                        rules={[{ validator: validateDraftName(index) }]}
                        style={{ marginBottom: 8 }}
                      >
                        {isEditingName ? (
                          <Input
                            ref={draftNameInputRef}
                            aria-label="Назва нової послуги"
                            maxLength={256}
                            style={{ width: 440 }}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                e.preventDefault()
                                e.stopPropagation()
                                cancelDraftEditing(service._id)
                              } else if (e.key === 'Enter') {
                                e.preventDefault()
                                confirmDraftName(service._id)
                              }
                            }}
                            onBlur={() => confirmDraftName(service._id)}
                            suffix={
                              <Button
                                type="text"
                                size="small"
                                icon={<CloseOutlined />}
                                aria-label="Скасувати створення послуги"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => cancelDraftEditing(service._id)}
                              />
                            }
                          />
                        ) : (
                          <DraftServiceName
                            onEdit={() =>
                              startEditingDraft(service._id, service.label)
                            }
                          />
                        )}
                      </Form.Item>
                    )}
                    <Form.Item
                      name={[field.name, 'price']}
                      label={isDraft ? undefined : service?.label}
                      rules={
                        isServiceForm &&
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
                          width: disabled ? '100%' : !isServiceForm ? 440 : 470,
                        }}
                        disabled={disabled}
                      />
                    </Form.Item>
                  </div>
                  {!disabled && (isAdmin || isDraft) && !isServiceForm && (
                    <Button
                      type="text"
                      icon={<CloseOutlined />}
                      aria-label={`remove-${service?.label}`}
                      data-testid={`remove-${service?.label}`}
                      onClick={() => handleRemoveService(index)}
                      style={{ marginTop: 6 }}
                    />
                  )}
                </Space>
              )
            })}
          </>
        )}
      </Form.List>
    </div>
  )
}

interface DraftServiceNameProps {
  value?: string
  onEdit: () => void
}

const DraftServiceName: FC<DraftServiceNameProps> = ({ value, onEdit }) => (
  <Space size={4}>
    <Typography.Text>{value}</Typography.Text>
    <Typography.Text type="secondary">(нова)</Typography.Text>
    <Button
      type="text"
      size="small"
      icon={<EditOutlined />}
      aria-label={`Перейменувати ${value}`}
      onClick={onEdit}
    />
  </Space>
)

export default CustomServicesCard
