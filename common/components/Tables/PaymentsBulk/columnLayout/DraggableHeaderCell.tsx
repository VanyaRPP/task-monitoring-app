import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Props = React.HTMLAttributes<HTMLTableCellElement> & {
  'data-column-id'?: string
}

/** <th>, який тягається, якщо в колонки є data-column-id; інакше звичайний. */
const DraggableHeaderCell: React.FC<Props> = ({
  'data-column-id': id,
  style,
  ...rest
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id ?? '__none__', disabled: !id })

  if (!id) return <th style={style} {...rest} />

  return (
    <th
      ref={setNodeRef}
      {...rest}
      {...attributes}
      {...listeners}
      style={{
        ...style,
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 999 : style?.zIndex,
        touchAction: 'none',
      }}
    />
  )
}

export default DraggableHeaderCell
