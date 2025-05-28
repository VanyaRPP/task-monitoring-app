import { ReactNode } from "react"

export type PaymentOptions = {
  searchEmail?: string | string[]
  userEmail: string
}

export type FloatButtonItem = {
  key: string
  icon: ReactNode
  onClick: () => void
  tooltip?: string
}
