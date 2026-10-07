import React, { CSSProperties, ReactNode } from 'react'
import { Button, Dropdown, Tooltip } from 'antd'
import {
  CloseOutlined,
  EyeOutlined,
  SaveOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import useTheme from '@modules/hooks/useTheme'
import WidgetVisibilityMenu from '@components/UI/WidgetVisibilityMenu'
import s from './style.module.scss'

interface Props<K extends string = string> {
  /** Підказка кнопки приховування: «Приховати віджети», «Приховати колонки». */
  hideTitle: string
  hidden: K[]
  onHiddenChange: (updated: K[]) => void
  available: K[]
  labels: Record<K, string>
  onReset: () => void
  onSave: () => void
  onClose: () => void
  /** Ліва частина панелі (напр. кнопки-віджети дашборду). */
  children?: ReactNode
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
  children,
  style,
}: Props<K>) {
  const [theme] = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={`${s.toolbar} ${isDark ? s.dark : s.light}`} style={style}>
      <div className={s.buttonsBlock}>{children}</div>
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
