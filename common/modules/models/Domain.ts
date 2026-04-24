import mongoose, { ObjectId, Schema } from 'mongoose'

export interface IDomain {
  _id: string
  name: string
  adminEmails: [string]
  streets: [ObjectId]
  description: string
  mfo: string
  iban: string
  rnokpp: string
  IEName: string
  domainBankToken: IDomainBankToken[]
  domainServices: string[]
  customServices: ICustomService[]
  domainType?: string
  ownServiceName?: string
  ownServiceValue?: string | number
  customDomainTypeLabel?: string
  customServiceGroupName?: string
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
  token: string
  shortToken: string
  tokenName: string
  confidant: string[]
}

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
  domainBankToken: { type: [Object] },
  domainServices: { type: [Object] },
  defaultTemplate: { type: String, required: false },
  customServices: [
    {
      groupName: { type: String, required: true },
      services: [{ type: String, required: true }],
    },
  ],
  domainType: { type: String, required: false },
  ownServiceName: { type: String, required: false },
  ownServiceValue: { type: Schema.Types.Mixed, required: false },
  customDomainTypeLabel: { type: String, required: false },
  customServiceGroupName: { type: String, required: false },
})

const Domain =
  (mongoose.models?.Domain as mongoose.Model<IDomain>) ||
  mongoose.model('Domain', DomainSchema)

export default Domain
