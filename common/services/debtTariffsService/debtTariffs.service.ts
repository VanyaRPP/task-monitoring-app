import Domain from '@modules/models/Domain'
import Street from '@modules/models/Street'
import { readPdfText } from '@common/services/aiAssistant/documents/pdf'
import {
  IBuildingTariffs,
  sanitizeBuildingTariffs,
} from '@utils/debt-calculation/building-tariffs'
import {
  ITariffPdfRead,
  readTariffTable,
} from '@utils/debt-calculation/tariff-pdf'

/**
 * The tariffs of a provider's buildings for the debt calculation: kept on the
 * domain, one entry per address (or one for the companies with none). The
 * callers have already checked the user may edit the domain.
 */

export class DebtTariffsError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

const sameStreet = (a?: string, b?: string): boolean =>
  (a ?? undefined) === (b ?? undefined)

export async function getBuildingTariffs(
  domainId: string
): Promise<IBuildingTariffs[]> {
  const domain = await Domain.findById(domainId).select('+debtTariffs').lean()
  return (domain?.debtTariffs ?? []).flatMap((entry) => {
    const clean = sanitizeBuildingTariffs(entry)
    return clean ? [clean] : []
  })
}

/**
 * Replaces the tariffs of one address. Ones with no periods left are removed:
 * clearing the table is how a building's tariffs are deleted.
 */
export async function saveBuildingTariffs(
  domainId: string,
  source: unknown
): Promise<IBuildingTariffs[]> {
  const tariffs = sanitizeBuildingTariffs(source)
  if (!tariffs) {
    throw new DebtTariffsError('Потрібна хоча б одна група тарифів', 400)
  }

  const domain = await Domain.findById(domainId)
    .select('+debtTariffs streets')
    .lean()
  if (!domain) throw new DebtTariffsError('Надавача не знайдено', 404)

  // Only an address of this provider: the id comes from the browser.
  if (
    tariffs.street &&
    !(domain.streets ?? []).some((id) => String(id) === tariffs.street)
  ) {
    throw new DebtTariffsError('Це адреса іншого надавача', 400)
  }

  const others = (domain.debtTariffs ?? [])
    .map((entry) => sanitizeBuildingTariffs(entry))
    .filter(
      (entry): entry is IBuildingTariffs =>
        !!entry && !sameStreet(entry.street, tariffs.street)
    )
  const next =
    tariffs.periods.length > 0
      ? [...others, { ...tariffs, updatedAt: new Date().toISOString() }]
      : others

  await Domain.updateOne({ _id: domainId }, { $set: { debtTariffs: next } })
  return next
}

/** «вул. Покровська, 149» and «Покровська 149» are one address. */
const addressKey = (value: string): string =>
  (value ?? '')
    .toLowerCase()
    .replace(
      /(^|\s)(вул(иця)?|просп(ект)?|пр-т|пров(улок)?|бульв(ар)?|бул|пл(оща)?|м)\.?(?=\s|$)/g,
      ' '
    )
    .replace(/[^\p{L}\p{N}]+/gu, '')

export interface ITariffsPdfResult extends ITariffPdfRead {
  /** The provider's address the document names, when there is one. */
  street?: string
}

/** Reads a tariffs PDF. Nothing is written - the user saves from the page. */
export async function readTariffsPdf(
  domainId: string,
  pdf: Uint8Array
): Promise<ITariffsPdfResult> {
  const read = readTariffTable(await readPdfText(pdf))
  const address = read.tariffs?.address
  if (!address) return read

  const domain = await Domain.findById(domainId).select('streets').lean()
  const streets = await Street.find({
    _id: { $in: (domain?.streets ?? []).map(String) },
  })
    .select('address')
    .lean()
  const key = addressKey(address)
  const found = streets.find(
    (street) => key && addressKey(street.address) === key
  )

  return found ? { ...read, street: String(found._id) } : read
}
