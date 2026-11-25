import { getPaymentsOrderPipeline } from './pipelines'
import { PAYMENTS_TIMEZONE, SortOrder } from '@utils/constants'

const stageOf = (pipeline: any[], name: string) =>
  pipeline.find((stage) => name in stage)?.[name]

describe('getPaymentsOrderPipeline', () => {
  it('buckets by the calendar day in the business timezone, ignoring the time', () => {
    const pipeline = getPaymentsOrderPipeline({})

    expect(stageOf(pipeline, '$addFields').invoiceCreationDay).toEqual({
      $dateTrunc: {
        date: '$invoiceCreationDate',
        unit: 'day',
        timezone: PAYMENTS_TIMEZONE,
      },
    })
  })

  it('buckets by the month of the month service, falling back to the invoice date', () => {
    const pipeline = getPaymentsOrderPipeline({})

    expect(stageOf(pipeline, '$addFields').invoiceMonth).toEqual({
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
    })
  })

  it('looks the month service up whether its id is a string or an ObjectId', () => {
    const lookup = stageOf(getPaymentsOrderPipeline({}), '$lookup')

    expect(lookup.from).toBe('services')
    expect(lookup.let).toEqual({ monthServiceId: '$monthService' })
    expect(lookup.pipeline[0].$match.$expr.$eq[1]).toEqual({
      $convert: {
        input: '$$monthServiceId',
        to: 'objectId',
        onError: null,
        onNull: null,
      },
    })
    expect(lookup.as).toBe('monthServiceDoc')
  })

  it('tracks the newest entry of each company within a day of a month', () => {
    expect(stageOf(getPaymentsOrderPipeline({}), '$setWindowFields')).toEqual({
      partitionBy: {
        month: '$invoiceMonth',
        day: '$invoiceCreationDay',
        company: '$company',
      },
      output: { companyDayLatest: { $max: '$invoiceCreationDate' } },
    })
  })

  it('sorts by month, then day, then company group, then type, so a credit sits right above its debit', () => {
    const sort = stageOf(getPaymentsOrderPipeline({}), '$sort')

    expect(Object.keys(sort)).toEqual([
      'invoiceMonth',
      'invoiceCreationDay',
      'companyDayLatest',
      'company',
      'type',
      'invoiceCreationDate',
      '_id',
    ])
    expect(sort).toEqual({
      invoiceMonth: SortOrder.DESC,
      invoiceCreationDay: SortOrder.DESC,
      companyDayLatest: SortOrder.DESC,
      company: SortOrder.ASC,
      type: SortOrder.ASC,
      invoiceCreationDate: SortOrder.DESC,
      _id: SortOrder.ASC,
    })
  })

  it('keeps the caller filter as the first stage', () => {
    const options = { type: 'debit', company: { $in: ['a'] } }
    const pipeline = getPaymentsOrderPipeline(options)

    expect(pipeline[0]).toEqual({ $match: options })
  })

  it('returns only ids - the documents are hydrated separately', () => {
    const pipeline = getPaymentsOrderPipeline({})

    expect(pipeline[pipeline.length - 1]).toEqual({ $project: { _id: 1 } })
  })

  it('pages with $skip / $limit when both are given', () => {
    const pipeline = getPaymentsOrderPipeline({}, { skip: '20', limit: '10' })

    expect(stageOf(pipeline, '$skip')).toBe(20)
    expect(stageOf(pipeline, '$limit')).toBe(10)
    expect(pipeline.findIndex((stage) => '$skip' in stage)).toBeGreaterThan(
      pipeline.findIndex((stage) => '$sort' in stage)
    )
  })

  it('omits the paging stages when skip/limit are absent', () => {
    const pipeline = getPaymentsOrderPipeline({})

    expect(stageOf(pipeline, '$skip')).toBeUndefined()
    expect(stageOf(pipeline, '$limit')).toBeUndefined()
  })

  it('omits $skip for the first page but still applies $limit', () => {
    const pipeline = getPaymentsOrderPipeline({}, { skip: '0', limit: '10' })

    expect(stageOf(pipeline, '$skip')).toBeUndefined()
    expect(stageOf(pipeline, '$limit')).toBe(10)
  })

  it('ignores unparseable paging values', () => {
    const pipeline = getPaymentsOrderPipeline({}, {
      skip: 'abc',
      limit: '',
    } as any)

    expect(stageOf(pipeline, '$skip')).toBeUndefined()
    expect(stageOf(pipeline, '$limit')).toBeUndefined()
  })
})
