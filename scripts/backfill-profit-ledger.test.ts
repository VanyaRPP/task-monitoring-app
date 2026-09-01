import { expect } from '@jest/globals'
import mongoose from 'mongoose'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { payments, domains } from '@utils/testData'
import Profit from '@common/modules/models/Profit'
import Payment from '@common/modules/models/Payment'
import { backfillProfitLedger } from './backfill-profit-ledger'

setupTestEnvironment()

const livePaymentId = new mongoose.Types.ObjectId(payments[0]._id)
const deletedPaymentId = new mongoose.Types.ObjectId()

// Raw insert so we can write a document with no `payment` key at all, which
// the schema default would otherwise turn into an explicit null.
const insertRaw = (docs: any[]) => Profit.collection.insertMany(docs)

const base = {
  domain: new mongoose.Types.ObjectId(domains[0]._id),
  date: new Date('2026-06-10T00:00:00.000Z'),
}

describe('backfillProfitLedger', () => {
  // The shared fixture seeds `profits`; start from an empty collection so the
  // counts below mean exactly what each test inserts.
  beforeEach(async () => {
    await Profit.deleteMany({})
  })

  const seedMirrorMatchingItsPayment = async () => {
    const payment = (await Payment.findById(livePaymentId).lean()) as any
    await insertRaw([
      {
        ...base,
        payment: livePaymentId,
        amount: payment.generalSum,
        type: payment.type,
        description: 'mirror of a live payment',
      },
    ])
    return payment
  }

  it('removes mirrors whose payment still exists', async () => {
    await seedMirrorMatchingItsPayment()

    const report = await backfillProfitLedger()

    expect(report.mirrorsRemoved).toBe(1)
    expect(report.orphansRemoved).toBe(0)
    expect(report.divergedFromPayment).toBe(0)
    expect(await Profit.countDocuments({})).toBe(0)
  })

  it('removes orphans and counts them separately', async () => {
    await seedMirrorMatchingItsPayment()
    await insertRaw([
      {
        ...base,
        payment: deletedPaymentId,
        amount: 500,
        type: 'credit',
        description: 'payment already deleted',
      },
    ])

    const report = await backfillProfitLedger()

    expect(report.mirrorsRemoved).toBe(2)
    expect(report.orphansRemoved).toBe(1)
    expect(await Profit.countDocuments({})).toBe(0)
  })

  it('leaves manual records alone, whether payment is null or absent', async () => {
    await seedMirrorMatchingItsPayment()
    await insertRaw([
      {
        ...base,
        payment: null,
        amount: 300,
        type: 'debit',
        categories: ['Оренда'],
        description: 'rent - explicit null',
      },
      {
        ...base,
        amount: 120,
        type: 'debit',
        categories: ['Комуналка'],
        description: 'utilities - no payment key at all',
      },
    ])

    const report = await backfillProfitLedger()

    expect(report.mirrorsRemoved).toBe(1)
    expect(report.manualKept).toBe(2)

    const left = await Profit.find({}).lean()
    expect(left).toHaveLength(2)
    expect(left.map((r: any) => r.amount).sort()).toEqual([120, 300])
  })

  it('counts mirrors whose amount or type drifted from the payment', async () => {
    const payment = (await Payment.findById(livePaymentId).lean()) as any
    await insertRaw([
      {
        ...base,
        payment: livePaymentId,
        // hand-edited away from the source payment
        amount: payment.generalSum + 1000,
        type: payment.type,
        description: 'edited amount',
      },
    ])

    const report = await backfillProfitLedger()

    expect(report.mirrorsRemoved).toBe(1)
    expect(report.divergedFromPayment).toBe(1)
    expect(report.orphansRemoved).toBe(0)
  })

  it('dry run reports but deletes nothing', async () => {
    await seedMirrorMatchingItsPayment()
    await insertRaw([
      { ...base, payment: null, amount: 300, type: 'debit', description: 'm' },
    ])

    const report = await backfillProfitLedger({ dryRun: true })

    expect(report.dryRun).toBe(true)
    expect(report.mirrorsRemoved).toBe(1)
    expect(report.manualKept).toBe(1)
    expect(await Profit.countDocuments({})).toBe(2)
  })

  it('is idempotent - a second run finds nothing left to remove', async () => {
    await seedMirrorMatchingItsPayment()
    await insertRaw([
      { ...base, payment: null, amount: 300, type: 'debit', description: 'm' },
    ])

    await backfillProfitLedger()
    const second = await backfillProfitLedger()

    expect(second.mirrorsRemoved).toBe(0)
    expect(second.orphansRemoved).toBe(0)
    expect(second.manualKept).toBe(1)
    expect(await Profit.countDocuments({})).toBe(1)
  })
})
