/**
 * Seed the global consumer-price-index (CPI) reference table.
 *
 * Idempotent: an existing month keeps its stored value, so a manual correction
 * is never clobbered by a re-run. Pass `overwrite` to force the seeded value.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/seed-inflation-indexes.ts
 *
 * The `--env-file` flag is required because dbConnect.ts validates
 * MONGODB_URI at module-load time, which happens BEFORE any in-script
 * dotenv.config() call (ES-module imports are hoisted).
 */
/* eslint-disable no-console */
import mongoose from 'mongoose'
import InflationIndex from '../common/modules/models/InflationIndex'
import dbConnect from '../utils/dbConnect'
import { formatPeriod } from '../utils/debt-calculation/months'

/**
 * Derzhstat's official monthly CPI: [year, month, index %].
 *
 * January 2015 through August 2026, from three reconciled sources:
 * - Jan 2015 - Oct 2021: index.minfin.com.ua, buhgalter.com.ua and
 *   services.dtkt.ua, which agreed on every month;
 * - Nov 2021 - Jun 2025: column K of the «Акт» sheet in `Розрахунок.xlsx`,
 *   reconciled against the HOA's own calculation and against the same
 *   aggregators;
 * - Jul 2025 - Aug 2026: Derzhstat express releases, cross-checked against
 *   index.minfin.com.ua and buhgalter.com.ua.
 *
 * August 2026 is the last published month: Derzhstat releases the CPI around
 * the 9th-10th of the following month, so September lands in October.
 *
 * Nothing outside that range is seeded on purpose - inventing statistics for a
 * legal calculation is not acceptable. Extend it via POST /api/inflation-index.
 */
export const INFLATION_INDEXES: [number, number, number][] = [
  [2015, 1, 103.1],
  [2015, 2, 105.3],
  [2015, 3, 110.8],
  [2015, 4, 114],
  [2015, 5, 102.2],
  [2015, 6, 100.4],
  [2015, 7, 99],
  [2015, 8, 99.2],
  [2015, 9, 102.3],
  [2015, 10, 98.7],
  [2015, 11, 102],
  [2015, 12, 100.7],
  [2016, 1, 100.9],
  [2016, 2, 99.6],
  [2016, 3, 101],
  [2016, 4, 103.5],
  [2016, 5, 100.1],
  [2016, 6, 99.8],
  [2016, 7, 99.9],
  [2016, 8, 99.7],
  [2016, 9, 101.8],
  [2016, 10, 102.8],
  [2016, 11, 101.8],
  [2016, 12, 100.9],
  [2017, 1, 101.1],
  [2017, 2, 101],
  [2017, 3, 101.8],
  [2017, 4, 100.9],
  [2017, 5, 101.3],
  [2017, 6, 101.6],
  [2017, 7, 100.2],
  [2017, 8, 99.9],
  [2017, 9, 102],
  [2017, 10, 101.2],
  [2017, 11, 100.9],
  [2017, 12, 101],
  [2018, 1, 101.5],
  [2018, 2, 100.9],
  [2018, 3, 101.1],
  [2018, 4, 100.8],
  [2018, 5, 100],
  [2018, 6, 100],
  [2018, 7, 99.3],
  [2018, 8, 100],
  [2018, 9, 101.9],
  [2018, 10, 101.7],
  [2018, 11, 101.4],
  [2018, 12, 100.8],
  [2019, 1, 101],
  [2019, 2, 100.5],
  [2019, 3, 100.9],
  [2019, 4, 101],
  [2019, 5, 100.7],
  [2019, 6, 99.5],
  [2019, 7, 99.4],
  [2019, 8, 99.7],
  [2019, 9, 100.7],
  [2019, 10, 100.7],
  [2019, 11, 100.1],
  [2019, 12, 99.8],
  [2020, 1, 100.2],
  [2020, 2, 99.7],
  [2020, 3, 100.8],
  [2020, 4, 100.8],
  [2020, 5, 100.3],
  [2020, 6, 100.2],
  [2020, 7, 99.4],
  [2020, 8, 99.8],
  [2020, 9, 100.5],
  [2020, 10, 101],
  [2020, 11, 101.3],
  [2020, 12, 100.9],
  [2021, 1, 101.3],
  [2021, 2, 101],
  [2021, 3, 101.7],
  [2021, 4, 100.7],
  [2021, 5, 101.3],
  [2021, 6, 100.2],
  [2021, 7, 100.1],
  [2021, 8, 99.8],
  [2021, 9, 101.2],
  [2021, 10, 100.9],
  [2021, 11, 100.8],
  [2021, 12, 100.6],
  [2022, 1, 101.3],
  [2022, 2, 101.6],
  [2022, 3, 104.5],
  [2022, 4, 103.1],
  [2022, 5, 102.7],
  [2022, 6, 103.1],
  [2022, 7, 100.7],
  [2022, 8, 101.1],
  [2022, 9, 101.9],
  [2022, 10, 102.5],
  [2022, 11, 100.7],
  [2022, 12, 100.7],
  [2023, 1, 100.8],
  [2023, 2, 100.7],
  [2023, 3, 101.5],
  [2023, 4, 100.2],
  [2023, 5, 100.5],
  [2023, 6, 100.8],
  [2023, 7, 99.4],
  [2023, 8, 98.6],
  [2023, 9, 100.5],
  [2023, 10, 100.8],
  [2023, 11, 100.5],
  [2023, 12, 100.7],
  [2024, 1, 100.4],
  [2024, 2, 100.3],
  [2024, 3, 100.5],
  [2024, 4, 100.2],
  [2024, 5, 100.6],
  [2024, 6, 102.2],
  [2024, 7, 100],
  [2024, 8, 100.6],
  [2024, 9, 101.5],
  [2024, 10, 101.8],
  [2024, 11, 101.9],
  [2024, 12, 101.4],
  [2025, 1, 101.2],
  [2025, 2, 100.8],
  [2025, 3, 101.5],
  [2025, 4, 100.7],
  [2025, 5, 101.3],
  [2025, 6, 100.8],
  [2025, 7, 99.8],
  [2025, 8, 99.8],
  [2025, 9, 100.3],
  [2025, 10, 100.9],
  [2025, 11, 100.4],
  [2025, 12, 100.2],
  [2026, 1, 100.7],
  [2026, 2, 101],
  [2026, 3, 101.7],
  [2026, 4, 101.4],
  [2026, 5, 100.9],
  [2026, 6, 99.9],
  [2026, 7, 100.3],
  [2026, 8, 100.1],
]

export interface ISeedInflationReport {
  created: string[]
  updated: string[]
  skipped: string[]
}

export async function seedInflationIndexes(
  rows: [number, number, number][] = INFLATION_INDEXES,
  options: { overwrite?: boolean } = {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  log: (msg: string) => void = () => {}
): Promise<ISeedInflationReport> {
  const report: ISeedInflationReport = {
    created: [],
    updated: [],
    skipped: [],
  }

  for (const [year, month, value] of rows) {
    const period = formatPeriod({ year, month })
    const existing = await InflationIndex.findOne({ year, month }).lean()

    if (!existing) {
      await InflationIndex.create({ year, month, value })
      log(`[seed] ІСЦ ${period} = ${value} — створено`)
      report.created.push(period)
      continue
    }

    if (options.overwrite && existing.value !== value) {
      await InflationIndex.updateOne({ year, month }, { $set: { value } })
      log(`[seed] ІСЦ ${period}: ${existing.value} → ${value} — оновлено`)
      report.updated.push(period)
      continue
    }

    log(`[seed] ІСЦ ${period} вже є (${existing.value}) — пропущено`)
    report.skipped.push(period)
  }

  return report
}

async function main(): Promise<void> {
  await dbConnect()
  const overwrite = process.argv.includes('--overwrite')
  const report = await seedInflationIndexes(
    INFLATION_INDEXES,
    { overwrite },
    console.log
  )
  console.log(
    `[seed] створено ${report.created.length}, оновлено ${report.updated.length}, пропущено ${report.skipped.length}`
  )
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('[seed] done')
      return mongoose.disconnect()
    })
    .catch(async (err) => {
      console.error('[seed] failed', err)
      await mongoose.disconnect()
      process.exit(1)
    })
}
