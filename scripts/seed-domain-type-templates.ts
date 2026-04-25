/**
 * Seed built-in DomainTypeTemplate records.
 *
 * Idempotent: re-running keeps existing built-in templates intact and only
 * adds missing ones. Designed to be run once per environment.
 *
 * Run with: `npx tsx scripts/seed-domain-type-templates.ts`
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import dbConnect from '../utils/dbConnect'
import DomainTypeTemplate from '../common/modules/models/domain-type-template'
import { defaultServices } from '../utils/constants'
import mongoose from 'mongoose'

export interface IBuiltInTemplate {
  name: string
  groups: { groupName: string; serviceIds: string[] }[]
}

export const BUILT_IN_TEMPLATES: IBuiltInTemplate[] = [
  {
    name: 'Комунальні',
    groups: [
      {
        groupName: 'Стандартні послуги',
        serviceIds: [...defaultServices],
      },
    ],
  },
]

export interface ISeedReport {
  created: string[]
  skipped: string[]
}

export async function seedDomainTypeTemplates(
  templates: IBuiltInTemplate[] = BUILT_IN_TEMPLATES,
  log: (msg: string) => void = () => {}
): Promise<ISeedReport> {
  const report: ISeedReport = { created: [], skipped: [] }
  for (const tpl of templates) {
    const existing = await DomainTypeTemplate.findOne({ name: tpl.name }).lean()
    if (existing) {
      log(`[seed] template "${tpl.name}" already exists — skip`)
      report.skipped.push(tpl.name)
      continue
    }
    const groups = tpl.groups.map((g) => ({
      groupName: g.groupName,
      serviceIds: g.serviceIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id)),
    }))
    await DomainTypeTemplate.create({
      name: tpl.name,
      isBuiltIn: true,
      groups,
    })
    log(`[seed] template "${tpl.name}" created`)
    report.created.push(tpl.name)
  }
  return report
}

async function main(): Promise<void> {
  await dbConnect()
  await seedDomainTypeTemplates(BUILT_IN_TEMPLATES, console.log)
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
