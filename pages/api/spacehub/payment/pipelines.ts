import { PAYMENTS_TIMEZONE, SortOrder } from '@utils/constants'
import type { PipelineStage } from 'mongoose'

export function getPaymentsOrderPipeline(
  options: Record<string, unknown>,
  { skip, limit }: { skip?: string | number; limit?: string | number } = {}
) {
  const pipeline: PipelineStage[] = [
    { $match: options },
    {
      $addFields: {
        invoiceCreationDay: {
          $dateTrunc: {
            date: '$invoiceCreationDate',
            unit: 'day',
            timezone: PAYMENTS_TIMEZONE,
          },
        },
      },
    },
    {
      $setWindowFields: {
        partitionBy: { day: '$invoiceCreationDay', company: '$company' },
        output: {
          companyDayLatest: { $max: '$invoiceCreationDate' },
        },
      },
    },
    {
      $sort: {
        invoiceCreationDay: SortOrder.DESC,
        companyDayLatest: SortOrder.DESC,
        company: SortOrder.ASC,
        type: SortOrder.ASC,
        invoiceCreationDate: SortOrder.DESC,
        _id: SortOrder.ASC,
      },
    },
  ]

  const skipValue = Number(skip)
  if (Number.isFinite(skipValue) && skipValue > 0) {
    pipeline.push({ $skip: skipValue })
  }

  const limitValue = Number(limit)
  if (Number.isFinite(limitValue) && limitValue > 0) {
    pipeline.push({ $limit: limitValue })
  }

  pipeline.push({ $project: { _id: 1 } })

  return pipeline
}

export function getMaxInvoiceNumber() {
  return [
    {
      $group: {
        _id: null,
        maxNumber: { $max: '$invoiceNumber' },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]
}

interface IPaymentStatsCount {
  count: number
}

interface IPaymentStatsSum {
  _id: string | null
  totalSum: number
}

/** The single document getPaymentStatsPipeline returns. */
export interface IPaymentStats {
  total: IPaymentStatsCount[]
  domains: IPaymentStatsCount[]
  companies: IPaymentStatsCount[]
  creditDebit: IPaymentStatsSum[]
  generalSum: IPaymentStatsSum[]
  serviceTotals: IPaymentStatsSum[]
}

/**
 * Every figure the payments table shows beside the page, in one pass over the
 * filtered payments. `type` stays out of the shared $match: the service
 * totals count debit lines whatever type the table is filtered by.
 */
export function getPaymentStatsPipeline(
  options: Record<string, unknown>
): PipelineStage[] {
  const { type, ...shared } = options
  const ofType: PipelineStage.FacetPipelineStage[] =
    type === undefined ? [] : [{ $match: { type } }]
  // What `distinct` counted when it read documents: an explicit null is a
  // value, a missing field is not ($group alone would merge the two).
  const distinctCount = (field: string): PipelineStage.FacetPipelineStage[] => [
    ...ofType,
    { $match: { [field]: { $exists: true } } },
    { $group: { _id: `$${field}` } },
    { $count: 'count' },
  ]

  return [
    { $match: shared },
    {
      $facet: {
        total: [...ofType, { $count: 'count' }],
        domains: distinctCount('domain'),
        companies: distinctCount('company'),
        creditDebit: [
          ...ofType,
          { $group: { _id: '$type', totalSum: { $sum: '$generalSum' } } },
        ],
        generalSum: [
          ...ofType,
          {
            $group: { _id: 'generalSum', totalSum: { $sum: '$generalSum' } },
          },
        ],
        serviceTotals: [{ $match: { type: 'debit' } }, ...serviceTotalsStages],
      },
    },
  ]
}

const serviceTotalsStages: PipelineStage.FacetPipelineStage[] = [
  { $unwind: '$invoice' },
  {
    $addFields: {
      // mirror the column render (`item.sum || item.price`): prefer sum,
      // fall back to price. No value filter — negative lines (e.g. discounts)
      // must stay so the summary equals the visible column sum.
      invoiceSum: {
        $cond: {
          if: { $isNumber: '$invoice.sum' },
          then: { $toDouble: '$invoice.sum' },
          else: {
            $cond: {
              if: { $isNumber: '$invoice.price' },
              then: { $toDouble: '$invoice.price' },
              else: 0,
            },
          },
        },
      },
      invoiceKey: {
        $cond: {
          if: { $eq: ['$invoice.type', 'custom'] },
          then: { $concat: ['custom-name:', '$invoice.name'] },
          else: '$invoice.type',
        },
      },
    },
  },
  {
    $match: {
      invoiceKey: { $exists: true, $ne: null },
    },
  },
  {
    $group: {
      _id: '$invoiceKey',
      totalSum: { $sum: '$invoiceSum' },
    },
  },
]
