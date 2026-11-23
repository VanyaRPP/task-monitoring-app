import mongoose, { Schema, Types } from 'mongoose'
import type { IBuildingTariffs } from '@utils/debt-calculation/building-tariffs'

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
  /** Tariffs of the provider's buildings for the debt calculation, one per address. */
  debtTariffs?: IBuildingTariffs[]
  /** Client-facing names that replace a service's real name on invoices. */
  serviceAliases?: IDomainServiceAlias[]
  /** Hides quantity and unit price on every invoice of the domain. */
  hideQuantityAndPrice?: boolean
}

export interface IDomainServiceAlias {
  serviceId: string
  /** ServiceType of the service at save time: matches lines that lack serviceId. */
  serviceType?: string
  fieldName?: string
  serviceName?: string
  alias: string
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
  // Read and written only by /api/debt-calculation/tariffs, which checks its
  // shape (`sanitizeBuildingTariffs`): kept out of every other domain query,
  // so a domain form can neither carry it nor write a stale copy back.
  debtTariffs: { type: [Object], select: false, default: undefined },
  // Written only by /api/domain/[id]/service-alias (the domain PATCH drops it),
  // so a stale domain form cannot overwrite aliases.
  serviceAliases: { type: [Object], default: undefined },
  hideQuantityAndPrice: { type: Boolean },
})

const Domain: mongoose.Model<IDomain> =
  mongoose.models?.Domain || mongoose.model<IDomain>('Domain', DomainSchema)

export default Domain
