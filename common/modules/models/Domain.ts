import mongoose, { Schema, Types } from 'mongoose'

export interface IDomain {
  _id: string
  name: string
  adminEmails: [string]
  streets: [Types.ObjectId]
  description: string
  mfo: string
  iban: string
  rnokpp: string
  IEName: string
  domainBankToken: IDomainBankToken[]
  domainServices: string[]
  customServices: ICustomService[]
  disabledServiceIds?: string[]
  domainTypeTemplateId?: Types.ObjectId
  defaultTemplate?: string
  archived?: boolean
}

export interface ICustomService {
  groupName: string
  services: string[]
}

export interface IDomainService {
  name: string
  price: number
  enabled: boolean
}

export interface IDomainBankToken {
  /**
   * The encrypted PrivatBank token. Not selected by default - see
   * DomainBankTokenSchema - so it is absent from every query result unless
   * asked for with `.select('+domainBankToken.token')`.
   */
  token?: string
  /** Masked copy of the token, safe to show in the domain form. */
  shortToken: string
  name?: string
  tokenName?: string
  acc?: string
  confidant?: string[]
}

/**
 * `token` is `select: false`, so the encrypted secret never leaves the server
 * by accident: plain finds, `.lean()`, `findOneAndUpdate` results and
 * `populate('domain')` all leave it out. Code that needs it (the bank API
 * routes, the domain form's save) opts in with `+domainBankToken.token`.
 * Careful: selecting the parent explicitly (`.select('domainBankToken')`)
 * includes it again.
 *
 * `strict: false` keeps whatever else older entries carry - the field used to
 * be a plain `[Object]`.
 */
const DomainBankTokenSchema = new Schema<IDomainBankToken>(
  {
    token: { type: String, select: false },
    shortToken: { type: String },
    name: { type: String },
    tokenName: { type: String },
    acc: { type: String },
    confidant: { type: [String] },
  },
  { _id: false, strict: false }
)

const DomainSchema = new Schema<IDomain>({
  name: { type: String, required: true },
  adminEmails: { type: [String], required: true },
  streets: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Street' }],
    required: true,
  },
  description: { type: String, required: true },
  mfo: { type: String, required: false },
  iban: { type: String, required: false },
  rnokpp: { type: String, required: false },
  IEName: { type: String, required: false },
  domainBankToken: { type: [DomainBankTokenSchema] },
  domainServices: { type: [Object] },
  archived: { type: Boolean, required: false, default: false },
  defaultTemplate: { type: String, required: false },
  customServices: [
    {
      groupName: { type: String, required: true },
      services: [{ type: String, required: true }],
    },
  ],
  disabledServiceIds: { type: [String], default: [] },
  domainTypeTemplateId: {
    type: Schema.Types.ObjectId,
    ref: 'DomainTypeTemplate',
    required: false,
  },
})

const Domain: mongoose.Model<IDomain> =
  mongoose.models?.Domain || mongoose.model<IDomain>('Domain', DomainSchema)

export default Domain
