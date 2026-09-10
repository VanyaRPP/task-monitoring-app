import { getPaymentsOrderPipeline } from './pipelines'
import { PAYMENTS_TIMEZONE, SortOrder } from '@utils/constants'

const stageOf = (pipeline: any[], name: string) =>
  pipeline.find((stage) => name in stage)?.[name]

describe('getPaymentsOrderPipeline', () => {
  it('buckets by the calendar day in the business timezone', () => {
    const pipeline = getPaymentsOrderPipeline({})

    expect(stageOf(pipeline, '$addFields')).toEqual({
      invoiceCreationDay: {
        $dateTrunc: {
          date: '$invoiceCreationDate',
          unit: 'day',
          timezone: PAYMENTS_TIMEZONE,
        },
      },
    })
  })

  it('sorts by day, then type, so credits sit above debits on the same date', () => {
    const sort = stageOf(getPaymentsOrderPipeline({}), '$sort')

    expect(Object.keys(sort)).toEqual([
      'invoiceCreationDay',
      'type',
      'invoiceCreationDate',
      '_id',
    ])
    expect(sort).toEqual({
      invoiceCreationDay: SortOrder.DESC,
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
