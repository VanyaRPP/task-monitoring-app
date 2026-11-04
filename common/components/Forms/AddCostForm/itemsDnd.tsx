import { PointerSensor, useDraggable, useDroppable } from '@dnd-kit/core'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { theme } from 'antd'
import cn from 'classnames'
import s from './style.module.scss'

/** Pressing in any of these edits the line; it must never start a drag. */
const INTERACTIVE =
  'input, textarea, button, select, a, [contenteditable], .ant-select, .ant-input-number, .ant-picker'

export const canStartRowDrag = (target: EventTarget | null): boolean =>
  !(target instanceof Element && target.closest(INTERACTIVE))

/**
 * A line is moved by pressing and holding it anywhere outside its inputs -
 * no separate handle. The hold (see ROW_DRAG_ACTIVATION) keeps a plain click
 * a click and lets a touch screen still scroll the list.
 */
export class RowPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent }: ReactPointerEvent) =>
        nativeEvent.isPrimary &&
        nativeEvent.button === 0 &&
        canStartRowDrag(nativeEvent.target),
    },
  ]
}

export const ROW_DRAG_ACTIVATION = { delay: 250, tolerance: 5 }

/** Droppable ids are `${bucket}` (the header) or `${bucket}#body`. */
export const bucketFromDropId = (id: string | number): string =>
  String(id).split('#')[0]

interface DraggableItemRowProps {
  id: number
  enabled: boolean
  children: ReactNode
}

export const DraggableItemRow: React.FC<DraggableItemRowProps> = ({
  id,
  enabled,
  children,
}) => {
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id,
    disabled: !enabled,
  })
  return (
    <div
      ref={setNodeRef}
      // Only the listeners: the row holds inputs, so it must not take on the
      // button role and tab stop that `attributes` would add.
      {...(enabled ? listeners : {})}
      className={cn(s.itemRow, {
        [s.draggableRow]: enabled,
        [s.dragging]: isDragging,
      })}
    >
      {children}
    </div>
  )
}

interface BucketDropZoneProps {
  id: string
  children: ReactNode
}

export const BucketDropZone: React.FC<BucketDropZoneProps> = ({
  id,
  children,
}) => {
  const { token } = theme.useToken()
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={s.dropZone}
      style={
        isOver
          ? {
              outline: `2px dashed ${token.colorPrimary}`,
              background: token.colorPrimaryBg,
            }
          : undefined
      }
    >
      {children}
    </div>
  )
}
