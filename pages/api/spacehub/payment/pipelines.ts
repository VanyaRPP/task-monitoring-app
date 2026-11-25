import { PAYMENTS_TIMEZONE, SortOrder } from '@utils/constants'
import Service from '@modules/models/Service'
import type { PipelineStage } from 'mongoose'

/**
 * Orders the invoice table:
 *  1. by the month the invoice is *for* ("За місяць" column) - newest first.
 *     That is the month of its month service, or of `invoiceCreationDate` when
 *     it has none - never the moment the record was added;
 *  2. inside a month, by the calendar day of `invoiceCreationDate` (Kyiv time),
 *     so the time of day never splits one day into several groups;
 *  3. inside a day, company groups by their newest entry, credit above debit.
 */
export function getPaymentsOrderPipeline(
  options: Record<string, unknown>,
  { skip, limit }: { skip?: string | number; limit?: string | number } = {}
) {
  const pipeline: PipelineStage[] = [
    { $match: options },
    {
      // `monthService` is Mixed: the id may be stored as a string or an
      // ObjectId, so convert before matching instead of a plain localField.
      $lookup: {
        from: Service.collection.name,
        let: { monthServiceId: '$monthService' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  '$_id',
                  {
                    $convert: {
                      input: '$$monthServiceId',
                      to: 'objectId',
                      onError: null,
                      onNull: null,
                    },
                  },
                ],
              },
            },
          },
          { $project: { _id: 0, date: 1 } },
        ],
        as: 'monthServiceDoc',
      },
    },
    {
      $addFields: {
        invoiceMonth: {
          $dateTrunc: {
            date: {
              $ifNull: [
                { $first: '$monthServiceDoc.date' },
                '$invoiceCreationDate',
              ],
            },
            unit: 'month',
            timezone: PAYMENTS_TIMEZONE,
          },
        },
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
        partitionBy: {
          month: '$invoiceMonth',
          day: '$invoiceCreationDay',
          company: '$company',
        },
        output: {
          companyDayLatest: { $max: '$invoiceCreationDate' },
        },
      },
    },
    {
      $sort: {
        invoiceMonth: SortOrder.DESC,
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

export function getCreditDebitPipeline(options) {
  return [
    { $match: options }, // Apply the matching based on options
    {
      $group: {
        _id: '$type', // Group by type
        totalSum: { $sum: '$generalSum' }, // Calculate the total sum for each type
      },
    },
  ]
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

export function getTotalGeneralSumPipeline(options) {
  return [
    { $match: options },
    {
      $group: {
        _id: 'generalSum',
        totalSum: { $sum: '$generalSum' },
      },
    },
  ]
}

export function getServiceTotalsPipeline(options: Record<string, unknown>) {
  return [
    { $match: { ...options, type: 'debit' } },
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
}
