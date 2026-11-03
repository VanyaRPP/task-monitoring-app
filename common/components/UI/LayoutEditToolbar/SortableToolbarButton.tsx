import React from 'react'
import { Button } from 'antd'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Props {
  id: string
  onClick?: () => void
  children: React.ReactNode
}

/** Кнопка панелі редагування, яку можна перетягувати по горизонталі. */
const SortableToolbarButton: React.FC<Props> = ({ id, onClick, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style: React.CSSProperties = {
    // Повний зсув (X і Y): кнопки переносяться на кілька рядків.
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    display: 'flex',
    willChange: 'transform',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Button
        type="link"
        onClick={onClick}
        style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
      >
        {children}
      </Button>
    </div>
  )
}

export default SortableToolbarButton
