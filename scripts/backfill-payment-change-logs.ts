/**
 * Backfill audit fields on legacy PaymentChangeLog records.
 *
 *   1. actionType missing  -> 'UPDATE'
 *   2. source missing -> 'single'
 *   3. domainId / companyId missing -> pulled from the referenced Payment
 *      (Payment.findById(log.paymentId)). Logs whose payment was deleted are
 *      left as-is and reported as `logsSkippedNoPayment`.
 *
 * Run a dry-run first (writes nothing, just reports):
 *   npx tsx --env-file=.env.local scripts/backfill-payment-change-logs.ts --dry
 *
 * Then the real run:
 *   npx tsx --env-file=.env.local scripts/backfill-payment-change-logs.ts
 *
 * The `--env-file` flag is required because dbConnect.ts validates MONGODB_URI
 * at module-load time (ES-module imports are hoisted before any dotenv call).
 *
 * BACK UP the `paymentchangelogs` collection before the real run.
 */
/* eslint-disable no-console */
import dbConnect from '../utils/dbConnect'
import PaymentChangeLog from '../common/modules/models/PaymentChangeLog'
import Payment from '../common/modules/models/Payment'
import mongoose from 'mongoose'

export interface IBackfillReport {
  dryRun: boolean
  actionTypeBackfilled: number
  sourceBackfilled: number
  domainIdBackfilled: number
  companyIdBackfilled: number
  logsScannedForRefs: number
  logsSkippedNoPayment: number
}

export async function backfillPaymentChangeLogs(
  options: { dryRun?: boolean; log?: (msg: string) => void } = {}
): Promise<IBackfillReport> {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const { dryRun = false, log = () => {} } = options

  const report: IBackfillReport = {
    dryRun,
    actionTypeBackfilled: 0,
    sourceBackfilled: 0,
    domainIdBackfilled: 0,
    companyIdBackfilled: 0,
    logsScannedForRefs: 0,
    logsSkippedNoPayment: 0,
  }

  report.actionTypeBackfilled = await PaymentChangeLog.countDocuments({
    actionType: { $exists: false },
  })
  if (!dryRun && report.actionTypeBackfilled > 0) {
    await PaymentChangeLog.updateMany(
      { actionType: { $exists: false } },
      { $set: { actionType: 'UPDATE' } }
    )
  }

  report.sourceBackfilled = await PaymentChangeLog.countDocuments({
    source: { $exists: false },
  })
  if (!dryRun && report.sourceBackfilled > 0) {
    await PaymentChangeLog.updateMany(
      { source: { $exists: false } },
      { $set: { source: 'single' } }
    )
  }

  const logs = (await PaymentChangeLog.find({
    paymentId: { $exists: true, $ne: null },
    $or: [{ domainId: { $exists: false } }, { companyId: { $exists: false } }],
  })
    .select('_id paymentId domainId companyId')
    .lean()) as Array<{
    _id: mongoose.Types.ObjectId
    paymentId: mongoose.Types.ObjectId
    domainId?: mongoose.Types.ObjectId
    companyId?: mongoose.Types.ObjectId
  }>

  report.logsScannedForRefs = logs.length

  const paymentIds = Array.from(
    new Set(logs.map((l) => l.paymentId?.toString()).filter(Boolean))
  )

  const payments = paymentIds.length
    ? ((await Payment.find({ _id: { $in: paymentIds } })
        .select('domain company')
        .lean()) as Array<{
        _id: mongoose.Types.ObjectId
        domain?: mongoose.Types.ObjectId
        company?: mongoose.Types.ObjectId
      }>)
    : []

  const paymentById = new Map(payments.map((p) => [p._id.toString(), p]))

  const ops: any[] = []
  for (const l of logs) {
    const payment = paymentById.get(l.paymentId?.toString())
    if (!payment) {
      report.logsSkippedNoPayment += 1
      continue
    }

    const set: Record<string, unknown> = {}
    if (l.domainId == null && payment.domain) set.domainId = payment.domain
    if (l.companyId == null && payment.company) set.companyId = payment.company
    if (Object.keys(set).length === 0) continue

    if (set.domainId) report.domainIdBackfilled += 1
    if (set.companyId) report.companyIdBackfilled += 1

    ops.push({ updateOne: { filter: { _id: l._id }, update: { $set: set } } })
  }

  if (!dryRun && ops.length > 0) {
    await PaymentChangeLog.bulkWrite(ops)
  }

  log(
    `[backfill-logs]${dryRun ? ' (DRY)' : ''} ` +
      `actionType:${report.actionTypeBackfilled} ` +
      `source:${report.sourceBackfilled} ` +
      `domainId:${report.domainIdBackfilled} ` +
      `companyId:${report.companyIdBackfilled} ` +
      `scanned:${report.logsScannedForRefs} ` +
      `skippedNoPayment:${report.logsSkippedNoPayment}`
  )

  return report
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry')
  await dbConnect()
  const report = await backfillPaymentChangeLogs({ dryRun, log: console.log })
  console.log('[backfill-logs] report:', report)
}

if (require.main === module) {
  main()
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[backfill-logs] failed:', err)
      return mongoose.disconnect().finally(() => process.exit(1))
    })
}
