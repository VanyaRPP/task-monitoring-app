/**
 * Drop the Profit records that used to mirror Payment records.
 *
 * Background: income used to be written twice - once into `payments`, and
 * again into `profits` with `payment` pointing back at the source. The two
 * drifted apart constantly (deletes left orphans, edits left stale amounts,
 * and several sync paths were gated to global admins only). The profit page
 * now reads income straight from `payments`, so every `profits` row that has
 * a `payment` reference is a duplicate with no reader.
 *
 * What this removes:
 *   - mirrors  - profits with `payment` set, whose Payment still exists
 *   - orphans  - profits with `payment` set, whose Payment is already gone
 *
 * What it never touches:
 *   - manual records (`payment` null/absent) - the domain's own expenses and
 *     the occasional hand-entered income. These are the only rows the profit
 *     page still reads.
 *
 * `divergedFromPayment` counts mirrors whose amount or type no longer matches
 * their Payment - i.e. rows that carried a manual edit. They are deleted like
 * the rest (the edit was already producing wrong totals), but the count tells
 * you how much hand-editing had been going on before you commit.
 *
 * Idempotent: a second run finds nothing left to delete.
 *
 * Dry run first - writes nothing, just reports:
 *   npx tsx --env-file=.env.local scripts/backfill-profit-ledger.ts --dry
 *
 * The real run DELETES rows, so unlike the other backfills it refuses to
 * proceed without an explicit acknowledgement:
 *   npx tsx --env-file=.env.local scripts/backfill-profit-ledger.ts --confirm
 *
 * The `--env-file` flag is required because dbConnect.ts validates MONGODB_URI
 * at module-load time (ES-module imports are hoisted before any dotenv call).
 *
 * BACK UP the `profits` collection before the real run.
 */
/* eslint-disable no-console */
import dbConnect from '../utils/dbConnect'
import Profit from '../common/modules/models/Profit'
import Payment from '../common/modules/models/Payment'
import mongoose from 'mongoose'

export interface IProfitLedgerBackfillReport {
  dryRun: boolean
  /** Rows deleted (or that would be, on a dry run). */
  mirrorsRemoved: number
  /** Subset of the above whose Payment no longer exists. */
  orphansRemoved: number
  /** Subset whose amount/type had been edited away from its Payment. */
  divergedFromPayment: number
  /** Manual rows left alone. */
  manualKept: number
}

export async function backfillProfitLedger(
  options: { dryRun?: boolean; log?: (msg: string) => void } = {}
): Promise<IProfitLedgerBackfillReport> {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const { dryRun = false, log = () => {} } = options

  const report: IProfitLedgerBackfillReport = {
    dryRun,
    mirrorsRemoved: 0,
    orphansRemoved: 0,
    divergedFromPayment: 0,
    manualKept: 0,
  }

  const mirrorFilter = { payment: { $exists: true, $ne: null } }

  const mirrors = (await Profit.find(mirrorFilter)
    .select('_id payment amount type')
    .lean()) as Array<{
    _id: mongoose.Types.ObjectId
    payment: mongoose.Types.ObjectId
    amount: number
    type: 'debit' | 'credit'
  }>

  report.mirrorsRemoved = mirrors.length
  report.manualKept = await Profit.countDocuments({
    $or: [{ payment: { $exists: false } }, { payment: null }],
  })

  const paymentIds = Array.from(
    new Set(mirrors.map((m) => m.payment?.toString()).filter(Boolean))
  )

  const livePayments = paymentIds.length
    ? ((await Payment.find({ _id: { $in: paymentIds } })
        .select('generalSum type')
        .lean()) as Array<{
        _id: mongoose.Types.ObjectId
        generalSum?: number
        type?: string
      }>)
    : []

  const paymentById = new Map(livePayments.map((p) => [p._id.toString(), p]))

  for (const m of mirrors) {
    const payment = paymentById.get(m.payment?.toString())
    if (!payment) {
      report.orphansRemoved += 1
      continue
    }
    if (payment.generalSum !== m.amount || payment.type !== m.type) {
      report.divergedFromPayment += 1
    }
  }

  if (!dryRun && mirrors.length > 0) {
    await Profit.deleteMany({ _id: { $in: mirrors.map((m) => m._id) } })
  }

  log(
    `[backfill-profit]${dryRun ? ' (DRY)' : ''} ` +
      `mirrorsRemoved:${report.mirrorsRemoved} ` +
      `orphansRemoved:${report.orphansRemoved} ` +
      `divergedFromPayment:${report.divergedFromPayment} ` +
      `manualKept:${report.manualKept}`
  )

  return report
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry')
  const confirmed = process.argv.includes('--confirm')

  if (!dryRun && !confirmed) {
    console.error(
      '[backfill-profit] this run DELETES rows from `profits`.\n' +
        '  Preview it first:  --dry\n' +
        '  Then commit to it: --confirm'
    )
    process.exitCode = 1
    return
  }

  await dbConnect()
  await backfillProfitLedger({ dryRun, log: console.log })
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('[backfill-profit] done')
      return mongoose.disconnect()
    })
    .catch(async (err) => {
      console.error('[backfill-profit] failed', err)
      await mongoose.disconnect()
      process.exit(1)
    })
}
