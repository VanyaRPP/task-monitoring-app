import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { buildBulkInvoiceMap } from '@common/components/Tables/PaymentsBulk/buildInvoiceMap'
import {
  applyCustomColumnGate,
  buildTypedCustomColumn,
  getDefaultColumns,
  NATIVE_COLUMN_LABELS,
  hasTypedColumn,
  resolveServiceType,
} from '@common/components/Tables/PaymentsBulk/column.config'
import { buildTypedInvoiceEntry } from '@common/components/Tables/PaymentsBulk/buildTypedInvoiceEntry'
import { resolvePrevReading } from '@common/components/Tables/PaymentsBulk/prevReading'
import { resolveTypedServiceTariff } from '@common/components/Tables/PaymentsBulk/typedServiceTariff'
import serviceFilter from '@components/AddPaymentModal/serviceFilter'
import { AppRoutes, Operations } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'
import {
  Alert,
  Button,
  message,
  Dropdown,
  Empty,
  Form,
  InputNumber,
  Table,
  Tooltip,
} from 'antd'
import {
  CloseOutlined,
  EyeOutlined,
  SaveOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import { addButton, removeButton } from '@modules/store/floatButtonSlice'
import { useDragDropPanelFloatButton } from '@modules/hooks/useFloatButton'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import useTheme from '@modules/hooks/useTheme'
import dashboardStyles from '../../DashboardPage/style.module.scss'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import WidgetVisibilityMenu from '@common/components/UI/WidgetVisibilityMenu'
import { applyColumnLayout, mergeOrder, moveColumn } from './columnLayout'
import DraggableHeaderCell from './DraggableHeaderCell'
import HiddenColumnCells from './HiddenColumnCells'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { defaultServices } from '@utils/constants'
import { findPrevPaymentMatch } from './hooks/usePrevPayment/usePrevPayment'
import { Amount } from './cells/Amount'
import styles from './stylestable.module.scss'

const withColumnKey = (column: any, key: string) =>
  column ? { ...column, key } : column

const InvoicesTable: React.FC = () => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.PAYMENT_BULK

  const {
    form,
    service,
    companies,
    prevPayments,
    prevService,
    isLoading,
    isError,
  } = useInvoicesPaymentContext()

  const domainId = Form.useWatch('domain', form)

  const { data: customDomainServices } = useGetCustomServicesByDomainQuery(
    { domainId },
    { skip: !domainId }
  )

  // Мемоїзація по відповіді, а не по `?? []`: інакше кожен рендер давав новий
  // масив -> нове paymentsValue -> setFieldsValue затирав уже введені показники.
  const allowedServices = useMemo(
    () => (customDomainServices?.data ?? []).flatMap((group) => group.services),
    [customDomainServices]
  )

  const customServicesColumns = useMemo(
    () =>
      allowedServices
        .filter((s) => !defaultServices.includes(s?._id.toString()))
        .map((s) => {
          // Key each custom column by the service _id, NOT fieldName: two
          // services whose names differ only in parentheses ("електрика(1)")
          // transliterate to the SAME fieldName and would otherwise share inputs.
          const key = String(s._id)

          // A typed custom service (e.g. serviceType === Electricity) renders
          // with the SAME builder as the native communal column of that type.
          // Untyped services keep the plain Кількість/Ціна pair. Whether the
          // cells are hidden on rows whose company lacks the service is decided
          // by applyCustomColumnGate (area-based types render for everyone).
          const gateOpts = { serviceKey: key, fieldName: s.fieldName }

          const typedColumn = buildTypedCustomColumn(s, {
            key,
            losses: service?.losses,
            // Тариф із місячної послуги — для підпису колонки. Індивідуальна
            // ціна компанії враховується вже в рядку кожної компанії.
            price: resolveTypedServiceTariff(
              { service },
              { serviceId: key, fieldName: s.fieldName }
            ),
          })
          if (typedColumn)
            return withColumnKey(
              applyCustomColumnGate(typedColumn, s, gateOpts),
              key
            )

          const genericColumn = {
            title: s.name,
            children: [
              {
                title: 'Кількість',
                width: 120,
                render: (_: any, { name }: { name: number }) => (
                  <Amount name={name} fieldName={key} />
                ),
              },
              {
                title: 'Ціна',
                width: 140,
                render: (_: any, { name }: { name: number }) => (
                  <Form.Item
                    name={[name, 'invoice', key, 'sum']}
                    style={{ margin: 0 }}
                  >
                    <InputNumber
                      placeholder="Ціна"
                      style={{ width: '100%' }}
                      min={0}
                    />
                  </Form.Item>
                ),
              },
            ],
          }
          return withColumnKey(
            applyCustomColumnGate(genericColumn, s, gateOpts),
            key
          )
        }),
    [allowedServices, service]
  )

  const columns = useMemo(
    () =>
      getDefaultColumns(
        () => undefined,
        allowedServices,
        service?.losses,
        customServicesColumns
      ),
    [allowedServices, service?.losses, customServicesColumns]
  )

  // Рухомі колонки = ті, що мають key (Сума / Компанія / видалення фіксовані).
  const movableKeys = useMemo(
    () =>
      columns
        .filter((c) => c.key != null && !c.fixed)
        .map((c) => String(c.key)),
    [columns]
  )
  const labels = useMemo(() => {
    const map: Record<string, string> = { ...NATIVE_COLUMN_LABELS }
    allowedServices.forEach((s) => {
      map[String(s._id)] = s.name
    })
    return map
  }, [allowedServices])

  const [order, setOrder] = useState<string[]>([])
  const [hidden, setHidden] = useState<string[]>([])
  const currentOrder = useMemo(
    () => mergeOrder(order, movableKeys),
    [order, movableKeys]
  )

  const [isPanelVisible, togglePanelVisible, panelFloatButton] =
    useDragDropPanelFloatButton('payments-bulk')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )
  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!isPanelVisible || !over || active.id === over.id) return
      setOrder(moveColumn(currentOrder, String(active.id), String(over.id)))
    },
    [currentOrder, isPanelVisible]
  )
  const dispatch = useDispatch()
  const [theme] = useTheme()
  const isDark = theme === 'dark'
  const { data: user } = useGetCurrentUserQuery()
  const storageKey = `payments-bulk-columns-${user?._id ?? ''}`

  useEffect(() => {
    dispatch(addButton(panelFloatButton))
    return () => {
      dispatch(removeButton(panelFloatButton.key))
    }
  }, [dispatch, panelFloatButton])

  // Збережений порядок/видимість — як layout дашборду у localStorage.
  useEffect(() => {
    if (!user?._id) return
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
      if (saved) {
        setOrder(saved.order ?? [])
        setHidden(saved.hidden ?? [])
      }
    } catch {}
  }, [user?._id, storageKey])

  const resetLayout = useCallback(() => {
    setOrder([])
    setHidden([])
    try {
      localStorage.removeItem(storageKey)
    } catch {}
    message.success('Відновлено!')
    togglePanelVisible()
  }, [storageKey, togglePanelVisible])

  const saveLayout = useCallback(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ order: currentOrder, hidden })
      )
    } catch {}
    message.success('Збережено!')
    togglePanelVisible()
  }, [storageKey, currentOrder, hidden, togglePanelVisible])

  const paymentsValue = useMemo(() => {
    if (!companies || companies.length === 0 || !service) return []

    return companies.map((company) => {
      const prevPayment = findPrevPaymentMatch(prevPayments, {
        companyId: company._id,
        serviceId: prevService?._id,
        streetId: prevService?.street?._id,
        domainId: prevService?.domain?._id,
      })

      const validPrevPayment =
        prevPayment?.type === Operations.Debit ? prevPayment : undefined

      const allinvoice = getInvoices({
        company,
        service,
        prevService,
        prevPayment: validPrevPayment,
      })

      const filteredInvoice = serviceFilter(allinvoice, allowedServices)

      const invoice = buildBulkInvoiceMap(allinvoice, filteredInvoice)

      for (const s of allowedServices) {
        if (defaultServices.includes(s?._id?.toString())) continue
        // Unique per-service key (see the columns above) — fieldName can collide.
        const key = String(s?._id ?? '')
        if (!key) continue

        const fieldKey = s.fieldName
        // getInvoices seeds a base custom entry keyed by fieldName; adopt it and
        // re-key to the unique _id, dropping the fieldName copy so a service is
        // never submitted twice.
        const existing =
          invoice[key] ?? (fieldKey ? invoice[fieldKey] : undefined)
        if (fieldKey && fieldKey !== key && invoice[fieldKey]) {
          delete invoice[fieldKey]
        }

        const base = {
          ...(existing || { type: 'custom' }),
          fieldName: fieldKey,
          name: s.name,
          serviceId: key,
        }

        const serviceType = resolveServiceType(s)

        if (hasTypedColumn(serviceType)) {
          // Reading-based type (e.g. electricity): carry over the previous
          // period's meter reading as this period's "Стара" — matched by the
          // stable serviceId (fieldName can collide), exactly like the native
          // electricity column. Загальне is recomputed by the cell.
          const prevReading = resolvePrevReading(validPrevPayment, {
            serviceId: key,
            fieldName: fieldKey,
          })

          invoice[key] = buildTypedInvoiceEntry({
            customService: s,
            serviceType,
            company,
            service,
            prevReading,
            base,
          }) as (typeof invoice)[string]
        } else {
          const amount = (existing as any)?.amount
          invoice[key] = {
            ...base,
            amount: amount === undefined || amount === null ? 1 : amount,
          } as (typeof invoice)[string]
        }
      }

      return {
        company,
        invoice,
      }
    })
  }, [companies, service, prevService, prevPayments, allowedServices])

  useEffect(() => {
    if (!companies || companies.length === 0 || !service) {
      form.setFieldsValue({ payments: [] })
      return
    }

    form.setFieldsValue({ payments: paymentsValue })
  }, [form, companies, service, paymentsValue])

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <Form.List name="payments">
      {(fields, { remove }) => {
        const allColumns = getDefaultColumns(
          remove,
          allowedServices,
          service?.losses,
          customServicesColumns
        )
        const hiddenColumns = allColumns.filter(
          (c) => c.key != null && !c.fixed && hidden.includes(String(c.key))
        )
        const tableColumns = applyColumnLayout(
          allColumns,
          currentOrder,
          hidden
        ).map((c) =>
          isPanelVisible && c.key != null && !c.fixed
            ? {
                ...c,
                onHeaderCell: () =>
                  ({ 'data-column-id': String(c.key) }) as any,
              }
            : c
        )
        const visibleKeys = currentOrder.filter((k) => !hidden.includes(k))

        return (
          <>
            {isPanelVisible && (
              <div
                className={`${dashboardStyles.toolbar} ${
                  isDark ? dashboardStyles.dark : dashboardStyles.light
                }`}
                style={{ marginBottom: 8 }}
              >
                <div className={dashboardStyles.buttonsBlock} />
                <div className={dashboardStyles.actions}>
                  <div
                    className={dashboardStyles.divider}
                    style={{ backgroundColor: isDark ? '#555' : '#ccc' }}
                  />
                  <Dropdown
                    trigger={['click']}
                    popupRender={() => (
                      <div style={{ padding: 8 }}>
                        <WidgetVisibilityMenu
                          hidden={hidden}
                          onChange={setHidden}
                          available={currentOrder}
                          labels={labels}
                        />
                      </div>
                    )}
                  >
                    <Tooltip title="Приховати колонки">
                      <Button
                        icon={<EyeOutlined />}
                        aria-label="Приховати колонки"
                      />
                    </Tooltip>
                  </Dropdown>
                  <Tooltip title="Відновати">
                    <Button
                      icon={<UndoOutlined />}
                      aria-label="Відновити колонки"
                      onClick={resetLayout}
                    />
                  </Tooltip>
                  <Tooltip title="Зберегти">
                    <Button
                      icon={<SaveOutlined />}
                      aria-label="Зберегти колонки"
                      onClick={saveLayout}
                    />
                  </Tooltip>
                  <Tooltip title="Вийти з режиму редагування">
                    <Button
                      icon={<CloseOutlined />}
                      onClick={togglePanelVisible}
                    />
                  </Tooltip>
                </div>
              </div>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={visibleKeys}
                strategy={horizontalListSortingStrategy}
              >
                <Table
                  className={styles.customTable}
                  bordered
                  rowKey="name"
                  size="small"
                  pagination={false}
                  loading={isLoading}
                  tableLayout="fixed"
                  columns={tableColumns}
                  components={{ header: { cell: DraggableHeaderCell } }}
                  dataSource={fields}
                  scroll={{ x: 1200 }}
                  locale={{
                    emptyText: (
                      <Empty description="За даною адресою послуг не знайдено!" />
                    ),
                  }}
                />
              </SortableContext>
            </DndContext>
            <HiddenColumnCells
              columns={hiddenColumns}
              names={fields.map((f) => f.name)}
            />
          </>
        )
      }}
    </Form.List>
  )
}

export default InvoicesTable
