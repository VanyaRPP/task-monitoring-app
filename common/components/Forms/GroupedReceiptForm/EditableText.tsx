import { CSSProperties, FC, ReactNode } from 'react'
import { EditableValuePath, useInvoiceEditContext } from './InvoiceEditContext'
import s from './EditableText.module.scss'

interface Props {
  /** Localized label override key (section headings, captions, table headers). */
  fieldKey?: string
  /** Special override / description field. */
  valuePath?: EditableValuePath
  /** Resolved value for read mode + seed for the input. */
  defaultValue: string
  /** Read-mode markup; falls back to `defaultValue` text when omitted. */
  children?: ReactNode
  multiline?: boolean
  style?: CSSProperties
}

/**
 * Renders `children`/`defaultValue` statically, except inside an edit context
 * (`editMode: true`) where it becomes an inline input bound to the draft.
 */
const EditableText: FC<Props> = ({
  fieldKey,
  valuePath,
  defaultValue,
  children,
  multiline,
  style,
}) => {
  const ctx = useInvoiceEditContext()

  if (!ctx.editMode) {
    return <>{children ?? defaultValue}</>
  }

  const draft = valuePath
    ? ctx.getValue?.(valuePath)
    : fieldKey
      ? ctx.getLabel?.(fieldKey)
      : undefined
  const value = draft ?? defaultValue ?? ''

  const handleChange = (next: string) => {
    if (valuePath) ctx.setValue?.(valuePath, next)
    else if (fieldKey) ctx.setLabel?.(fieldKey, next)
  }

  if (multiline) {
    return (
      <textarea
        className={`${s.field} ${s.textarea}`}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        rows={5}
        style={style}
      />
    )
  }

  return (
    <input
      className={s.field}
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      style={style}
    />
  )
}

export default EditableText
