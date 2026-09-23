/**
 * Seed the built-in «Квартплата» bundle: the global catalog service plus the
 * `real-estate` DomainTypeTemplate that carries it.
 *
 * Attaching that template to a domain is what unlocks the debt-calculation
 * page for it — see `utils/domain/housing-fee-access.ts`.
 *
 * Idempotent: an existing service or template is left untouched.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/seed-housing-fee-service.ts
 *
 * The `--env-file` flag is required because dbConnect.ts validates
 * MONGODB_URI at module-load time, which happens BEFORE any in-script
 * dotenv.config() call (ES-module imports are hoisted).
 */
/* eslint-disable no-console */
import mongoose from 'mongoose'
import CustomService from '../common/modules/models/CustomService'
import { HOUSING_FEE_SERVICE_ID, ServiceType } from '../utils/constants'
import dbConnect from '../utils/dbConnect'
import {
  IBuiltInTemplate,
  ISeedReport,
  seedDomainTypeTemplates,
} from './seed-domain-type-templates'

export const HOUSING_FEE_SERVICE_NAME = 'Квартплата з нарахуванням боргу'

/**
 * Глобальна послуга-каталог: без `domain`, рівно як вбудовані комунальні. У
 * домен вона потрапляє копією через clone-for-domain, і копія несе той самий
 * `serviceType`.
 */
export const HOUSING_FEE_TEMPLATE: IBuiltInTemplate = {
  name: 'Квартплата',
  category: 'real-estate',
  groups: [
    {
      groupName: 'Квартплата',
      serviceIds: [HOUSING_FEE_SERVICE_ID],
    },
  ],
}

export interface ISeedHousingFeeReport {
  serviceCreated: boolean
  templates: ISeedReport
}

export async function seedHousingFeeService(
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  log: (msg: string) => void = () => {}
): Promise<ISeedHousingFeeReport> {
  const existing = await CustomService.findById(HOUSING_FEE_SERVICE_ID).lean()
  let serviceCreated = false

  if (existing) {
    log(`[seed] послуга «${HOUSING_FEE_SERVICE_NAME}» вже є — пропущено`)
  } else {
    await CustomService.create({
      _id: new mongoose.Types.ObjectId(HOUSING_FEE_SERVICE_ID),
      name: HOUSING_FEE_SERVICE_NAME,
      fieldName: ServiceType.HousingFee,
      serviceType: ServiceType.HousingFee,
    })
    log(`[seed] послуга «${HOUSING_FEE_SERVICE_NAME}» створена`)
    serviceCreated = true
  }

  const templates = await seedDomainTypeTemplates([HOUSING_FEE_TEMPLATE], log)

  return { serviceCreated, templates }
}

async function main(): Promise<void> {
  await dbConnect()
  await seedHousingFeeService(console.log)
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
