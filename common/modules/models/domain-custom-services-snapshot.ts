import mongoose, { Schema, Types } from 'mongoose'

export type DomainSnapshotReason = 'template-switch' | 'manual'

export const DOMAIN_SNAPSHOT_REASONS: DomainSnapshotReason[] = [
  'template-switch',
  'manual',
]

export interface IDomainSnapshotGroup {
  groupName: string
  services: string[]
}

export interface IDomainCustomServicesSnapshot {
  _id: Types.ObjectId
  domainId: Types.ObjectId
  templateId?: Types.ObjectId | null
  templateName?: string | null
  groups: IDomainSnapshotGroup[]
  reason: DomainSnapshotReason
  createdBy?: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const SnapshotGroupSchema = new Schema<IDomainSnapshotGroup>(
  {
    groupName: { type: String, required: true },
    services: [{ type: String }],
  },
  { _id: false }
)

const DomainCustomServicesSnapshotSchema =
  new Schema<IDomainCustomServicesSnapshot>(
    {
      domainId: {
        type: Schema.Types.ObjectId,
        ref: 'Domain',
        required: true,
      },
      templateId: {
        type: Schema.Types.ObjectId,
        ref: 'DomainTypeTemplate',
        default: null,
      },
      templateName: { type: String, default: null },
      groups: { type: [SnapshotGroupSchema], default: [] },
      reason: {
        type: String,
        enum: DOMAIN_SNAPSHOT_REASONS,
        default: 'template-switch',
        required: true,
      },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    },
    { timestamps: true }
  )

DomainCustomServicesSnapshotSchema.index({ domainId: 1, createdAt: -1 })

const DomainCustomServicesSnapshot =
  (mongoose.models
    ?.DomainCustomServicesSnapshot as mongoose.Model<IDomainCustomServicesSnapshot>) ||
  mongoose.model<IDomainCustomServicesSnapshot>(
    'DomainCustomServicesSnapshot',
    DomainCustomServicesSnapshotSchema
  )

export default DomainCustomServicesSnapshot
