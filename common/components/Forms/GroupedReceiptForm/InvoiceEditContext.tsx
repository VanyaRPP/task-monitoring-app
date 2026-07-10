import { createContext, useContext } from 'react'

/** Override/description fields that map to a single editable region. */
export type EditableValuePath =
  | 'invoiceTitle'
  | 'footerText'
  | 'providerDescription'
  | 'receiverDescription'

export interface InvoiceEditContextValue {
  editMode: boolean
  lang: 'en' | 'uk'
  /** Raw draft value for the current language (no cross-language fallback). */
  getValue?: (path: EditableValuePath) => string | undefined
  setValue?: (path: EditableValuePath, value: string) => void
  /** Localized label override by stable key (for section headings, captions). */
  getLabel?: (key: string) => string | undefined
  setLabel?: (key: string, value: string) => void
}

/**
 * Channel that turns template text into inline inputs. Only the template editor
 * provides `editMode: true`; everywhere else (preview, PDF) the default applies,
 * so templates render statically and stay read-only.
 */
export const InvoiceEditContext = createContext<InvoiceEditContextValue>({
  editMode: false,
  lang: 'uk',
})

export const useInvoiceEditContext = () => useContext(InvoiceEditContext)
