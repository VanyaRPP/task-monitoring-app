import mongoose, { ObjectId, Schema } from 'mongoose'

export type LocalizedText = { en?: string; uk?: string }

/**
 * Render-time overrides applied on top of a base layout (`baseTemplateKey`).
 * Grows over time — adding a field here + reading it in the templates is the
 * mechanical path to richer templates without new layout components.
 */
export interface IInvoiceTemplateOverrides {
  accentColor?: string
  logoUrl?: string
  invoiceTitle?: LocalizedText
  footerText?: LocalizedText
  labels?: Record<string, LocalizedText>
  show?: {
    tax?: boolean
    quantity?: boolean
    bankDetails?: boolean
    dueDate?: boolean
  }
}

export interface IInvoiceTemplate {
  _id: string
  name: string
  baseTemplateKey: string
  providerDescription: string
  receiverDescription: string
  overrides?: IInvoiceTemplateOverrides
  domainId?: ObjectId | string
  isBuiltIn: boolean
  createdBy?: ObjectId | string
}

const LocalizedTextSchema = new Schema<LocalizedText>(
  { en: { type: String }, uk: { type: String } },
  { _id: false }
)

const OverridesSchema = new Schema<IInvoiceTemplateOverrides>(
  {
    accentColor: { type: String },
    logoUrl: { type: String },
    invoiceTitle: { type: LocalizedTextSchema, required: false },
    footerText: { type: LocalizedTextSchema, required: false },
    labels: { type: Schema.Types.Mixed },
    show: {
      tax: { type: Boolean },
      quantity: { type: Boolean },
      bankDetails: { type: Boolean },
      dueDate: { type: Boolean },
    },
  },
  { _id: false }
)

const InvoiceTemplateSchema = new Schema<IInvoiceTemplate>(
  {
    name: { type: String, required: true },
    baseTemplateKey: { type: String, required: true, default: 'classic' },
    providerDescription: { type: String, required: false, default: '' },
    receiverDescription: { type: String, required: false, default: '' },
    overrides: { type: OverridesSchema, required: false },
    domainId: {
      type: Schema.Types.ObjectId,
      ref: 'Domain',
      required: false,
      default: null,
    },
    isBuiltIn: { type: Boolean, required: true, default: false },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  { timestamps: true }
)

const InvoiceTemplate =
  (mongoose.models?.InvoiceTemplate as mongoose.Model<IInvoiceTemplate>) ||
  mongoose.model('InvoiceTemplate', InvoiceTemplateSchema)

export default InvoiceTemplate
