/**
 * Backfill `serviceType` on the 10 built-in communal CustomService records.
 *
 * Idempotent: only writes the field on records where it is currently missing
 * or different from the canonical value.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/backfill-utility-service-types.ts
 *
 * The `--env-file` flag is required because dbConnect.ts validates
 * MONGODB_URI at module-load time, which happens BEFORE any in-script
 * dotenv.config() call (ES-module imports are hoisted).
 */
import dbConnect from '../utils/dbConnect'
import CustomService from '../common/modules/models/CustomService'
import { UTILITY_SERVICE_ID_TO_TYPE } from '../utils/constants'
import mongoose from 'mongoose'

export interface IBackfillReport {
  updated: string[]
  unchanged: string[]
  missing: string[]
}

export async function backfillUtilityServiceTypes(
  mapping: Readonly<
    Partial<Record<string, string>>
  > = UTILITY_SERVICE_ID_TO_TYPE,
  log: (msg: string) => void = () => {}
): Promise<IBackfillReport> {
  const report: IBackfillReport = { updated: [], unchanged: [], missing: [] }
  for (const [id, type] of Object.entries(mapping)) {
    if (!type) continue
    if (!mongoose.Types.ObjectId.isValid(id)) {
      report.missing.push(id)
      log(`[backfill] skip invalid id ${id}`)
      continue
    }
    const existing = (await CustomService.findById(id).lean()) as {
      serviceType?: string
    } | null
    if (!existing) {
      report.missing.push(id)
      log(`[backfill] not found in DB: ${id}`)
      continue
    }
    if (existing.serviceType === type) {
      report.unchanged.push(id)
      continue
    }
    await CustomService.findByIdAndUpdate(id, { serviceType: type })
    report.updated.push(id)
    log(`[backfill] ${id} → serviceType=${type}`)
  }
  return report
}

async function main(): Promise<void> {
  await dbConnect()
  await backfillUtilityServiceTypes(UTILITY_SERVICE_ID_TO_TYPE, console.log)
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('[backfill] done')
      return mongoose.disconnect()
    })
    .catch(async (err) => {
      console.error('[backfill] failed', err)
      await mongoose.disconnect()
      process.exit(1)
    })
}
