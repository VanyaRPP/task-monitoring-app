import React, { CSSProperties, useCallback } from 'react'
import { Button, Dropdown, Tooltip } from 'antd'
import {
  CloseOutlined,
  EyeOutlined,
  SaveOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import useTheme from '@modules/hooks/useTheme'
import WidgetVisibilityMenu from '@components/UI/WidgetVisibilityMenu'
import SortableToolbarButton from './SortableToolbarButton'
import s from './style.module.scss'

const TOOLBAR_ID_PREFIX = 'toolbar-'
const toolbarId = (key: string) => `${TOOLBAR_ID_PREFIX}${key}`
const fromToolbarId = (id: string | number) =>
  String(id).replace(TOOLBAR_ID_PREFIX, '')

interface Props<K extends string = string> {
  /** Підказка кнопки приховування: «Приховати віджети», «Приховати колонки». */
  hideTitle: string
  hidden: K[]
  onHiddenChange: (updated: K[]) => void
  /** Що можна приховати (меню видимості). */
  available: K[]
  labels: Record<K, string>
  /** Видимі елементи в поточному порядку — кнопки, які можна перетягувати. */
  items: K[]
  onMove: (activeKey: K, overKey: K) => void
  onItemClick?: (key: K) => void
  onReset: () => void
  onSave: () => void
  onClose: () => void
  style?: CSSProperties
}

/** Панель режиму редагування layout: приховати / відновити / зберегти / вийти. */
function LayoutEditToolbar<K extends string = string>({
  hideTitle,
  hidden,
  onHiddenChange,
  available,
  labels,
  onReset,
  onSave,
  onClose,
  items,
  onMove,
  onItemClick,
  style,
}: Props<K>) {
  const [theme] = useTheme()
  const isDark = theme === 'dark'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )
  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return
      onMove(fromToolbarId(active.id) as K, fromToolbarId(over.id) as K)
    },
    [onMove]
  )

  return (
    <div className={`${s.toolbar} ${isDark ? s.dark : s.light}`} style={style}>
      <DndContext
        id="layout-edit-toolbar"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(toolbarId)}
          strategy={rectSortingStrategy}
        >
          <div className={s.buttonsBlock}>
            {items.map((key) => (
              <SortableToolbarButton
                key={toolbarId(key)}
                id={toolbarId(key)}
                onClick={onItemClick && (() => onItemClick(key))}
              >
                {labels[key]}
              </SortableToolbarButton>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className={s.actions}>
        <div
          className={s.divider}
          style={{ backgroundColor: isDark ? '#555' : '#ccc' }}
        />
        <Dropdown
          trigger={['click']}
          popupRender={() => (
            <div style={{ padding: 8 }}>
              <WidgetVisibilityMenu
                hidden={hidden}
                onChange={onHiddenChange}
                available={available}
                labels={labels}
              />
            </div>
          )}
        >
          <Tooltip title={hideTitle}>
            <Button icon={<EyeOutlined />} aria-label={hideTitle} />
          </Tooltip>
        </Dropdown>
        <Tooltip title="Відновити">
          <Button
            icon={<UndoOutlined />}
            aria-label="Відновити"
            onClick={onReset}
          />
        </Tooltip>
        <Tooltip title="Зберегти">
          <Button
            icon={<SaveOutlined />}
            aria-label="Зберегти"
            onClick={onSave}
          />
        </Tooltip>
        <Tooltip title="Вийти з режиму редагування">
          <Button
            icon={<CloseOutlined />}
            aria-label="Вийти з режиму редагування"
            onClick={onClose}
          />
        </Tooltip>
      </div>
    </div>
  )
}

export default LayoutEditToolbar
