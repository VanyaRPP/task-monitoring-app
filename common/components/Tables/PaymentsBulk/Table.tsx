import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import LayoutEditToolbar from '@common/components/UI/LayoutEditToolbar'
import { DndContext, closestCenter } from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Alert, Empty, Form, Table } from 'antd'
import { useMemo, useRef } from 'react'
import {
  applyColumnLayout,
  getMovableKeys,
  isMovableColumn,
} from './columnLayout/columnLayout'
import DraggableHeaderCell from './columnLayout/DraggableHeaderCell'
import HiddenColumnCells from './columnLayout/HiddenColumnCells'
import { useColumnLayout } from './columnLayout/useColumnLayout'
import {
  NATIVE_COLUMN_LABELS,
  getDefaultColumns,
} from './columns/column.config'
import { useCustomServicesColumns } from './columns/useCustomServicesColumns'
import { usePaymentsFormValue } from './invoice/usePaymentsFormValue'
import styles from './stylestable.module.scss'

const InvoicesTable: React.FC = () => {
  const { form, service, isLoading, isError } = useInvoicesPaymentContext()

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

  usePaymentsFormValue(allowedServices)

  const { columns: customServicesColumns, labels: customServicesLabels } =
    useCustomServicesColumns(allowedServices, service)

  // `remove` з'являється лише всередині Form.List, а колонки потрібні раніше
  // (ключі для layout) — тому кнопка видалення бере його через ref.
  const removeRef = useRef<(index: number) => void>()
  const columns = useMemo(
    () =>
      getDefaultColumns(
        (index) => removeRef.current?.(index),
        allowedServices,
        service?.losses,
        customServicesColumns
      ),
    [allowedServices, service?.losses, customServicesColumns]
  )

  const movableKeys = useMemo(() => getMovableKeys(columns), [columns])
  const labels = useMemo(
    () => ({ ...NATIVE_COLUMN_LABELS, ...customServicesLabels }),
    [customServicesLabels]
  )

  const {
    currentOrder,
    visibleKeys,
    hidden,
    setHidden,
    isPanelVisible,
    togglePanelVisible,
    resetLayout,
    saveLayout,
    sensors,
    handleDragEnd,
  } = useColumnLayout(movableKeys)

  const tableColumns = useMemo(
    () =>
      applyColumnLayout(columns, currentOrder, hidden).map((c) =>
        isPanelVisible && isMovableColumn(c)
          ? {
              ...c,
              onHeaderCell: () => ({ 'data-column-id': String(c.key) }) as any,
            }
          : c
      ),
    [columns, currentOrder, hidden, isPanelVisible]
  )
  const hiddenColumns = useMemo(
    () =>
      columns.filter(
        (c) => isMovableColumn(c) && hidden.includes(String(c.key))
      ),
    [columns, hidden]
  )

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <Form.List name="payments">
      {(fields, { remove }) => {
        removeRef.current = remove

        return (
          <>
            {isPanelVisible && (
              <LayoutEditToolbar
                hideTitle="Приховати колонки"
                hidden={hidden}
                onHiddenChange={setHidden}
                available={currentOrder}
                labels={labels}
                onReset={resetLayout}
                onSave={saveLayout}
                onClose={togglePanelVisible}
                style={{ marginBottom: 8 }}
              />
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
