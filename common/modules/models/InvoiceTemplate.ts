import mongoose, { ObjectId, Schema } from 'mongoose'

export interface IInvoiceTemplate {
  _id: string
  name: string
  baseTemplateKey: string
  providerDescription: string
  receiverDescription: string
  domainId?: ObjectId | string
  isBuiltIn: boolean
  createdBy?: ObjectId | string
}

const InvoiceTemplateSchema = new Schema<IInvoiceTemplate>(
  {
    name: { type: String, required: true },
    baseTemplateKey: { type: String, required: true, default: 'classic' },
    providerDescription: { type: String, required: false, default: '' },
    receiverDescription: { type: String, required: false, default: '' },
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
