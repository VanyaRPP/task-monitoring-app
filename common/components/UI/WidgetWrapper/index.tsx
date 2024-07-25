import React, { FC, ReactNode } from 'react'
import { useDynamicHeight } from '@modules/hooks/useDynamicHeight '
import s from './style.module.scss'

interface WidgetWrapperProps {
  id: string
  rowHeight: number
  marginY: number
  padding?: number
  onHeightChange: (id: string, h: number) => void
  children: ReactNode
  isEditMode
}

export const WidgetWrapper: FC<WidgetWrapperProps> = ({
  id,
  rowHeight,
  onHeightChange,
  children,
  marginY,
  padding,
  isEditMode,
}) => {
  const { ref } = useDynamicHeight({
    nodeHeightCallback: (h) => onHeightChange(id, h),
    gridRowHeight: rowHeight,
    marginY,
    padding,
  })

  return (
    <div ref={ref} className={s.block}>
      <div className={s.inner}>
        {children}
        {isEditMode && <div className={s.mask} />}
      </div>
    </div>
  )
}
