import mongoose from 'mongoose'
import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import Payment from '@common/modules/models/Payment'
import RealEstate from '@modules/models/RealEstate'
import { logPaymentMutation } from '@common/modules/services/paymentAudit'
import { reserveInvoiceNumbers } from '@common/services/paymentService/payment.service'
import {
  BUILT_IN_SERVICE_ID_TO_TYPE,
  Operations,
  ServiceType,
} from '@utils/constants'
import { resolveServiceType } from '@utils/domain/resolve-service-type'
import { getPaymentProviderAndReciever } from '@utils/helpers'
import { IYearMonth } from '@utils/debt-calculation/months'
import {
  CORRECTION_FIELD,
  OPENING_BALANCE_FIELD,
} from '@utils/debt-calculation/prefill'
import {
  IExistingPayment,
  IStatementImportPlan,
  IStatementImportResult,
  planStatementImport,
  Resolution,
  resolveStatementImport,
} from '@utils/debt-calculation/statement-plan'
import { IStatementImport } from '@utils/debt-calculation/statement'

/**
 * Turns the months of a company's debt calculation into its payments: a
 * housing-fee invoice per month (a correction as its own line), one credit per
 * month with payments, and a «Вхідне сальдо» invoice for the debt the history
 * starts with. The months usually came off statement photos and were checked
 * in the calculation table; once they are payments, the page reads them back
 * through its usual prefill.
 */

export class StatementImportError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'StatementImportError'
  }
}

export interface IImportActor {
  isGlobalAdmin: boolean
  user: { _id?: unknown; email: string }
}

export interface IHousingService {
  serviceId: string
  name: string
}

export interface IImportTarget {
  company: any
  housing: IHousingService
}

const HOUSING_FEE_NAME = 'Квартплата'
const OPENING_BALANCE_NAME = 'Вхідне сальдо'
const CORRECTION_NAME = 'Коректура'
/** How the created payments say where they came from. */
const IMPORT_DESCRIPTION = 'З розрахунку заборгованості'

/**
 * The domain's housing-fee service, so imported lines carry the same
 * `serviceId` as invoices made by hand. Looked up the way the debt page's
 * access check does: a domain-scoped copy first, then the domain's catalog.
 */
async function findHousingFeeService(
  domainId: string
): Promise<IHousingService | null> {
  const scoped = (await CustomService.findOne(
    { domain: domainId, serviceType: ServiceType.HousingFee },
    'name'
  ).lean()) as any
  if (scoped) {
    return { serviceId: String(scoped._id), name: scoped.name }
  }

  const domain = (await Domain.findById(
    domainId,
    'customServices'
  ).lean()) as any
  const ids: string[] = (domain?.customServices ?? []).flatMap(
    (group: any) => group?.services ?? []
  )

  const builtIn = ids.find(
    (id) => BUILT_IN_SERVICE_ID_TO_TYPE[id] === ServiceType.HousingFee
  )
  const docs = (await CustomService.find(
    { _id: { $in: ids.filter((id) => mongoose.Types.ObjectId.isValid(id)) } },
    'name serviceType fieldName'
  ).lean()) as any[]
  const found = docs.find(
    (doc) => resolveServiceType(doc) === ServiceType.HousingFee
  )

  if (found) return { serviceId: String(found._id), name: found.name }
  if (builtIn) return { serviceId: builtIn, name: HOUSING_FEE_NAME }

  return null
}

/**
 * The company to import into, with the checks every write needs: it belongs
 * to the domain, the user administers that domain, and the domain bills a
 * housing fee (without it the debt page would not even open).
 */
export async function loadImportTarget(
  domainId: string,
  companyId: string,
  actor: IImportActor
): Promise<IImportTarget> {
  const company = await RealEstate.findOne({ _id: companyId, domain: domainId })
    .populate('domain')
    .lean()
  if (!company) {
    throw new StatementImportError(404, 'Компанію не знайдено в цьому домені')
  }

  if (!actor.isGlobalAdmin) {
    const isDomainAdmin = await Domain.exists({
      _id: domainId,
      adminEmails: actor.user.email,
    })
    if (!isDomainAdmin) throw new StatementImportError(403, 'Немає доступу')
  }

  const housing = await findHousingFeeService(domainId)
  if (!housing) {
    throw new StatementImportError(
      400,
      'Домен не має послуги «Квартплата» — додайте її, щоб вести розрахунок боргу'
    )
  }

  return { company, housing }
}

async function loadCompanyPayments(
  domainId: string,
  companyId: string
): Promise<IExistingPayment[]> {
  const payments = await Payment.find(
    { domain: domainId, company: companyId },
    'type invoice generalSum invoiceCreationDate paidAt monthService'
  )
    .populate('monthService', 'date')
    .lean()

  return (payments as any[]).map((payment) => ({
    ...payment,
    _id: String(payment._id),
  }))
}

export async function planCompanyStatementImport(
  target: IImportTarget,
  statement: IStatementImport
): Promise<IStatementImportPlan> {
  const payments = await loadCompanyPayments(
    String(target.company.domain?._id ?? target.company.domain),
    String(target.company._id)
  )
  return planStatementImport(statement, payments)
}

/**
 * Noon UTC on the 1st: the same calendar day in every timezone the app runs
 * in, so the month never slips when read back in local time.
 */
const monthDate = ({ year, month }: IYearMonth, shiftMs = 0): Date =>
  new Date(Date.UTC(year, month - 1, 1, 12, 0, 0) + shiftMs)

const round2 = (value: number): number => Math.round(value * 100) / 100

export interface IBuildPaymentsArgs {
  target: IImportTarget
  statement: IStatementImport
  months: IStatementImport['months']
  createOpening: boolean
  source?: string
  firstInvoiceNumber: number
}

/**
 * The payment documents, oldest first, numbered in that order. Months with
 * nothing charged or paid produce nothing - an empty invoice is noise.
 */
export function buildStatementPayments({
  target: { company, housing },
  statement,
  months,
  createOpening,
  source,
  firstInvoiceNumber,
}: IBuildPaymentsArgs): Record<string, unknown>[] {
  const { provider, reciever } = getPaymentProviderAndReciever(company)
  const description = source
    ? `${IMPORT_DESCRIPTION}: ${source}`
    : IMPORT_DESCRIPTION
  const base = {
    domain: company.domain?._id ?? company.domain,
    ...(company.street ? { street: company.street } : {}),
    company: company._id,
    description,
    currency: company.currency || 'UAH',
    provider,
    reciever,
  }
  const docs: Record<string, unknown>[] = []
  let number = firstInvoiceNumber

  const housingLine = (name: string, sum: number, fieldName?: string) => ({
    type: ServiceType.HousingFee,
    name,
    serviceId: housing.serviceId,
    ...(fieldName ? { fieldName } : {}),
    price: sum,
    sum,
  })

  if (createOpening && statement.openingBalance) {
    const { amount } = statement.openingBalance
    docs.push({
      ...base,
      invoiceNumber: number++,
      type: Operations.Debit,
      // A moment before the month's own invoice, so it lists first.
      invoiceCreationDate: monthDate(statement.openingBalance, -1),
      generalSum: amount,
      invoice: [
        {
          type: ServiceType.Custom,
          name: OPENING_BALANCE_NAME,
          customName: OPENING_BALANCE_NAME,
          customService: true,
          fieldName: OPENING_BALANCE_FIELD,
          price: amount,
          sum: amount,
        },
      ],
      template: company.defaultTemplate || 'classic',
      invoiceLang: 'uk',
    })
  }

  for (const month of months) {
    if (month.charged !== 0 || month.correction !== 0) {
      const invoice = [
        ...(month.charged !== 0
          ? [housingLine(housing.name, month.charged)]
          : []),
        ...(month.correction !== 0
          ? [housingLine(CORRECTION_NAME, month.correction, CORRECTION_FIELD)]
          : []),
      ]
      docs.push({
        ...base,
        invoiceNumber: number++,
        type: Operations.Debit,
        invoiceCreationDate: monthDate(month),
        generalSum: round2(month.charged + month.correction),
        invoice,
        template: company.defaultTemplate || 'classic',
        invoiceLang: 'uk',
      })
    }

    if (month.paid !== 0) {
      docs.push({
        ...base,
        invoiceNumber: number++,
        type: Operations.Credit,
        // Right after the month's invoice, like a quick "mark paid".
        invoiceCreationDate: monthDate(month, 1),
        paidAt: monthDate(month),
        generalSum: month.paid,
        invoice: [],
      })
    }
  }

  return docs
}

/**
 * Recomputes the plan from the DB, applies the user's choices, writes.
 *
 * Creates first, deletes second: if the second step fails, the result is a
 * visible duplicate rather than a silent loss. Both land in the payment audit
 * log under one batch, so the audit page shows the import as a whole and any
 * deleted record can be restored from it. No invoice email goes out - these
 * are months long past.
 */
export async function applyCompanyStatementImport({
  target,
  statement,
  resolutions,
  source,
  actor,
}: {
  target: IImportTarget
  statement: IStatementImport
  resolutions?: Record<string, Resolution>
  source?: string
  actor: IImportActor
}): Promise<{ plan: IStatementImportPlan; result: IStatementImportResult }> {
  const plan = await planCompanyStatementImport(target, statement)
  const resolved = resolveStatementImport(statement, plan, resolutions)
  const batchId = new mongoose.Types.ObjectId()

  const docs = buildStatementPayments({
    target,
    statement,
    months: resolved.months,
    createOpening: resolved.createOpening,
    source,
    firstInvoiceNumber: 0,
  })
  // Numbers are reserved only now that it is known how many are needed, in
  // one block so the import's invoices stay consecutive.
  if (docs.length) {
    const first = await reserveInvoiceNumbers(docs.length)
    docs.forEach((doc, index) => {
      doc.invoiceNumber = first + index
    })
  }

  const created = docs.length ? ((await Payment.insertMany(docs)) as any[]) : []
  await Promise.all(
    created.map((payment) =>
      logPaymentMutation({
        actionType: 'BULK_CREATE',
        source: 'debt-import',
        actor: actor.user,
        after: payment,
        batchId,
      })
    )
  )

  let deletedIds: string[] = []
  if (resolved.deleteIds.length > 0) {
    const doomed = (await Payment.find({
      _id: { $in: resolved.deleteIds },
      company: target.company._id,
    })) as any[]
    await Payment.deleteMany({ _id: { $in: doomed.map(({ _id }) => _id) } })
    deletedIds = doomed.map(({ _id }) => String(_id))
    await Promise.all(
      doomed.map((payment) =>
        logPaymentMutation({
          actionType: 'BULK_DELETE',
          source: 'debt-import',
          actor: actor.user,
          before: payment,
          batchId,
        })
      )
    )
  }

  const debits = created.filter(
    (payment) =>
      payment.type === Operations.Debit &&
      !payment.invoice?.some(
        (line: any) => line.fieldName === OPENING_BALANCE_FIELD
      )
  ).length

  return {
    plan,
    result: {
      batchId: String(batchId),
      createdIds: created.map(({ _id }) => String(_id)),
      deletedIds,
      created: {
        debits,
        credits: created.filter(({ type }) => type === Operations.Credit)
          .length,
        opening: resolved.createOpening,
      },
    },
  }
}
