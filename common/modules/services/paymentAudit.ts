import { Types } from 'mongoose'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'
import type {
  PaymentActionType,
  PaymentMutationSource,
} from '@common/api/paymentApi/payment.api.types'

/**
 * A snapshot input may be a Mongoose document (with `.toObject()`) or an
 * already-plain object shaped like IPaymentSnapshot. Both are accepted and
 * normalised to a plain object before being stored.
 */
type SnapshotInput = Record<string, any>

interface Actor {
  _id?: any
  email?: string
}

export interface LogPaymentMutationArgs {
  actionType: PaymentActionType
  source: PaymentMutationSource
  actor?: Actor | null
  before?: SnapshotInput | null
  after?: SnapshotInput | null
  reason?: string
  batchId?: Types.ObjectId | string | null
}

const toSnapshot = (
  input?: SnapshotInput | null
): Record<string, any> | undefined => {
  if (!input) return undefined
  return typeof (input as any).toObject === 'function'
    ? (input as any).toObject()
    : input
}

/** Pull a ref id out of a snapshot field whether it's an ObjectId or populated. */
const extractRefId = (value: any) => {
  if (!value) return undefined
  if (typeof value === 'object' && value._id) return value._id
  return value
}

const buildInvoiceData = (snapshot: Record<string, any>) => ({
  invoiceNumber: snapshot.invoiceNumber,
  invoiceCreationDate: snapshot.invoiceCreationDate,
  invoice: snapshot.invoice,
  provider: snapshot.provider,
  reciever: snapshot.reciever,
  generalSum: snapshot.generalSum,
  description: snapshot.description,
  type: snapshot.type,
  currency: snapshot.currency,
})

/**
 * Write a single PaymentChangeLog audit entry for a payment mutation.
 *
 * Not-throw by design: if logging fails, the error is reported to the console
 * but never propagated, so it can never roll back the mutation it records.
 */
export async function logPaymentMutation(
  args: LogPaymentMutationArgs
): Promise<void> {
  try {
    const before = toSnapshot(args.before)
    const after = toSnapshot(args.after)

    const primary = before ?? after
    if (!primary) {
      // eslint-disable-next-line no-console
      console.error(
        '[payment-audit] logPaymentMutation called without before/after snapshot'
      )
      return
    }

    await PaymentChangeLog.create({
      paymentId: primary._id,
      date: new Date(),
      actionType: args.actionType,
      source: args.source,
      reason: args.reason,
      actorId: args.actor?._id,
      actorEmail: args.actor?.email,
      domainId: extractRefId(primary.domain),
      companyId: extractRefId(primary.company),
      batchId: args.batchId ?? undefined,
      before,
      after,
      invoiceData: buildInvoiceData(primary),
    })
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error(
      '[payment-audit] failed to write PaymentChangeLog:',
      error?.message ?? error
    )
  }
}
