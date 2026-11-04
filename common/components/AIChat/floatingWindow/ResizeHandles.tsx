import React from 'react'
import cn from 'classnames'
import { RESIZE_EDGES, ResizeEdge } from './geometry'
import styles from '../style.module.scss'

interface ResizeHandlesProps {
  onResizePointerDown: (
    edge: ResizeEdge
  ) => (event: React.PointerEvent<HTMLElement>) => void
}

/** Invisible strips on the four sides and squares on the four corners. */
const ResizeHandles: React.FC<ResizeHandlesProps> = ({
  onResizePointerDown,
}) => (
  <>
    {RESIZE_EDGES.map((edge) => (
      <div
        key={edge}
        data-resize-edge={edge}
        aria-hidden
        className={cn(styles.resizeHandle, styles[`resize-${edge}`])}
        onPointerDown={onResizePointerDown(edge)}
      />
    ))}
  </>
)

export default ResizeHandles
