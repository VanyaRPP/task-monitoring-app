import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import React from 'react'
import styles from './style.module.scss'

interface SortableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string | number
}

export const SortableRow: React.FC<SortableRowProps> = (props) => {
  const { setNodeRef, listeners, transform, transition, isDragging } =
    useSortable({ id: props['data-row-key'] })

  const className = [
    props.className,
    styles.sortableRow,
    isDragging ? styles.sortableRowDragging : '',
  ]
    .filter(Boolean)
    .join(' ')
  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 9999, opacity: 0.6 } : {}),
  }

  return (
    <tr
      {...props}
      className={className}
      ref={setNodeRef}
      style={style}
      {...listeners}
    />
  )
}
