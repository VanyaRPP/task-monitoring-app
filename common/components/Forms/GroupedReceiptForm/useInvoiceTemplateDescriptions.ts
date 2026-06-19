import { useGetInvoiceTemplatesQuery } from '@common/api/invoiceTemplateApi/invoiceTemplate.api'
import {
  IInvoiceTemplate,
  IInvoiceTemplateOverrides,
} from '@common/api/invoiceTemplateApi/invoiceTemplate.api.types'
import { usePaymentContext } from '@components/AddPaymentModal'
import { templateMap } from './templateMap'

interface Input {
  data?: any
}

export interface InvoiceTemplateDescriptions {
  domainId: string
  customTemplates: IInvoiceTemplate[]
  isCustomTemplate: boolean
  currentCustomTemplate: IInvoiceTemplate | null
  baseProviderDescription: string
  baseReceiverDescription: string
  descriptionOverrides: {
    providerDescription?: string
    receiverDescription?: string
  }
  overrides?: IInvoiceTemplateOverrides
}

/**
 * Read-only resolver shared by the preview (`GroupedReceiptForm`) and the editor
 * (`InvoiceTemplateDescriptions` in the "Рахунок" tab) so both agree on the
 * active template and its descriptions. Mutations live in the editor only —
 * preview stays a pure render surface.
 */
export function useInvoiceTemplateDescriptions({
  data,
}: Input = {}): InvoiceTemplateDescriptions {
  const { template, company } = usePaymentContext()

  const domainId: string =
    (typeof data?.domain === 'object' ? data?.domain?._id : data?.domain) ||
    (typeof company?.domain === 'object'
      ? (company.domain as any)?._id
      : company?.domain) ||
    ''

  const { data: customTemplatesRes } = useGetInvoiceTemplatesQuery(
    { domainId },
    { skip: !domainId }
  )
  const customTemplates = customTemplatesRes?.data ?? []

  const isCustomTemplate = !(template in templateMap)
  const currentCustomTemplate = isCustomTemplate
    ? (customTemplates.find((t) => t._id === template) ?? null)
    : null

  const baseProviderDescription: string =
    (typeof data?.domain === 'object' ? data?.domain?.description : '') ||
    (typeof company?.domain === 'object'
      ? (company.domain as any)?.description
      : '') ||
    ''
  const baseReceiverDescription: string =
    data?.reciever?.description || company?.description || ''

  const descriptionOverrides = currentCustomTemplate
    ? {
        providerDescription: currentCustomTemplate.providerDescription,
        receiverDescription: currentCustomTemplate.receiverDescription,
      }
    : {}

  return {
    domainId,
    customTemplates,
    isCustomTemplate,
    currentCustomTemplate,
    baseProviderDescription,
    baseReceiverDescription,
    descriptionOverrides,
    overrides: currentCustomTemplate?.overrides,
  }
}
