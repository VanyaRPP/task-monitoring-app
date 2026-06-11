import { CSSProperties, FC, ReactNode } from 'react'
import s from './EditableText.module.scss'

interface Props {
  editMode: boolean
  rawText: string
  onChange: (value: string) => void
  children: ReactNode
  rows?: number
  style?: CSSProperties
}

const EditableText: FC<Props> = ({
  editMode,
  rawText,
  onChange,
  children,
  rows = 5,
  style,
}) => {
  if (!editMode) return <>{children}</>

  return (
    <textarea
      value={rawText}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className={s.textarea}
      style={style}
    />
  )
}

export default EditableText
