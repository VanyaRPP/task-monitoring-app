/**
 * Seed built-in DomainTypeTemplate records.
 *
 * Idempotent: re-running keeps existing built-in templates intact and only
 * adds missing ones. Designed to be run once per environment.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/seed-domain-type-templates.ts
 *
 * The `--env-file` flag is required because dbConnect.ts validates
 * MONGODB_URI at module-load time, which happens BEFORE any in-script
 * dotenv.config() call (ES-module imports are hoisted).
 */
/* eslint-disable no-console */
import dbConnect from '../utils/dbConnect'
import DomainTypeTemplate, {
  DomainTypeTemplateCategory,
} from '../common/modules/models/domain-type-template'
import { defaultServices } from '../utils/constants'
import mongoose from 'mongoose'

export interface IBuiltInTemplate {
  name: string
  /** Drives which ServiceTypes are offered to a domain on this template. */
  category?: DomainTypeTemplateCategory
  groups: { groupName: string; serviceIds: string[] }[]
}

export const BUILT_IN_TEMPLATES: IBuiltInTemplate[] = [
  {
    name: 'Комунальні',
    category: 'utility',
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
  /**
   * A template with this name already exists but holds the wrong thing: our
   * services are missing, or the category differs. Usually because someone
   * created it by hand through the UI.
   */
  mismatched: string[]
  repaired: string[]
}

const validIds = (ids: string[]): string[] =>
  ids.filter((id) => mongoose.Types.ObjectId.isValid(id))

const expectedServiceIds = (tpl: IBuiltInTemplate): string[] =>
  validIds(tpl.groups.flatMap((g) => g.serviceIds))

const actualServiceIds = (existing: {
  groups?: { serviceIds?: unknown[] }[]
}): Set<string> =>
  new Set(
    (existing.groups ?? []).flatMap((g) =>
      (g.serviceIds ?? []).map((id) => String(id))
    )
  )

/**
 * Tops up an existing template with the missing services, leaving whatever is
 * already there alone.
 *
 * Groups are matched by name: an existing one gets its members merged, a
 * missing one is appended. Overwriting `groups` wholesale is not an option,
 * because someone may have added their own entries by hand.
 */
const mergeGroups = (
  tpl: IBuiltInTemplate,
  existing: { groups?: { groupName: string; serviceIds?: unknown[] }[] }
): { groupName: string; serviceIds: mongoose.Types.ObjectId[] }[] => {
  const merged = (existing.groups ?? []).map((g) => ({
    groupName: g.groupName,
    serviceIds: (g.serviceIds ?? []).map(
      (id) => new mongoose.Types.ObjectId(String(id))
    ),
  }))

  for (const group of tpl.groups) {
    const target = merged.find((g) => g.groupName === group.groupName)
    const ids = validIds(group.serviceIds).map(
      (id) => new mongoose.Types.ObjectId(id)
    )

    if (!target) {
      merged.push({ groupName: group.groupName, serviceIds: ids })
      continue
    }

    const present = new Set(target.serviceIds.map(String))
    for (const id of ids) {
      if (!present.has(String(id))) target.serviceIds.push(id)
    }
  }

  return merged
}

export async function seedDomainTypeTemplates(
  templates: IBuiltInTemplate[] = BUILT_IN_TEMPLATES,
  options: { repair?: boolean } = {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  log: (msg: string) => void = () => {}
): Promise<ISeedReport> {
  const report: ISeedReport = {
    created: [],
    skipped: [],
    mismatched: [],
    repaired: [],
  }
  for (const tpl of templates) {
    const existing = await DomainTypeTemplate.findOne({ name: tpl.name }).lean()
    if (existing) {
      const present = actualServiceIds(existing)
      const missing = expectedServiceIds(tpl).filter((id) => !present.has(id))
      const wrongCategory = !!tpl.category && existing.category !== tpl.category

      if (!missing.length && !wrongCategory) {
        log(`[seed] template "${tpl.name}" already exists — skip`)
        report.skipped.push(tpl.name)
        continue
      }

      if (!options.repair) {
        // A silent skip cost us here: a template created by hand through the
        // UI had the same name and an empty group, so the seed "succeeded"
        // while adding nothing.
        log(
          `[seed] УВАГА: шаблон "${tpl.name}" уже є, але не той:` +
            (missing.length ? ` бракує послуг ${missing.join(', ')};` : '') +
            (wrongCategory
              ? ` категорія "${existing.category}" замість "${tpl.category}";`
              : '') +
            ' перезапустіть із --repair, щоб виправити'
        )
        report.mismatched.push(tpl.name)
        continue
      }

      await DomainTypeTemplate.updateOne(
        { _id: existing._id },
        {
          $set: {
            groups: mergeGroups(tpl, existing),
            isBuiltIn: true,
            ...(tpl.category ? { category: tpl.category } : {}),
          },
        }
      )
      log(`[seed] шаблон "${tpl.name}" виправлено`)
      report.repaired.push(tpl.name)
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
      category: tpl.category ?? 'other',
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
  const repair = process.argv.includes('--repair')
  await seedDomainTypeTemplates(BUILT_IN_TEMPLATES, { repair }, console.log)
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
