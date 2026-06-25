import { expect } from '@jest/globals'
import mongoose from 'mongoose'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { payments, domains, realEstates } from '@utils/testData'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'
import { backfillPaymentChangeLogs } from './backfill-payment-change-logs'

setupTestEnvironment()

const invoiceData = {
  invoiceNumber: 1,
  invoiceCreationDate: new Date('2024-01-01'),
  invoice: [],
  provider: { description: 'p' },
  reciever: { companyName: 'c', adminEmails: [], description: 'd' },
  generalSum: 100,
  type: 'debit',
}

const insertRaw = (docs: any[]) =>
  PaymentChangeLog.collection.insertMany(docs)

const findRaw = (id: mongoose.Types.ObjectId) =>
  PaymentChangeLog.findById(id).lean() as any

describe('backfillPaymentChangeLogs', () => {
  const livePaymentId = new mongoose.Types.ObjectId(payments[0]._id)
  const deletedPaymentId = new mongoose.Types.ObjectId()

  const idLegacyLive = new mongoose.Types.ObjectId()
  const idLegacyDeleted = new mongoose.Types.ObjectId()
  const idComplete = new mongoose.Types.ObjectId()

  const seed = () =>
    insertRaw([
      {
        _id: idLegacyLive,
        paymentId: livePaymentId,
        date: new Date('2024-02-01'),
        invoiceData,
      },
      {
        _id: idLegacyDeleted,
        paymentId: deletedPaymentId,
        date: new Date('2024-02-02'),
        invoiceData,
      },
      {
        _id: idComplete,
        paymentId: new mongoose.Types.ObjectId(payments[1]._id),
        date: new Date('2024-02-03'),
        actionType: 'CREATE',
        source: 'single',
        domainId: new mongoose.Types.ObjectId(domains[1]._id),
        companyId: new mongoose.Types.ObjectId(realEstates[1]._id),
        invoiceData,
      },
    ])

  it('backfills actionType, source, domainId and companyId for legacy live entries', async () => {
    await seed()

    const report = await backfillPaymentChangeLogs({ dryRun: false })

    const live = await findRaw(idLegacyLive)
    expect(live.actionType).toBe('UPDATE')
    expect(live.source).toBe('single')
    expect(live.domainId.toString()).toBe(domains[0]._id)
    expect(live.companyId.toString()).toBe(realEstates[0]._id)

    expect(report.actionTypeBackfilled).toBe(2)
    expect(report.sourceBackfilled).toBe(2)
    expect(report.domainIdBackfilled).toBe(1)
    expect(report.companyIdBackfilled).toBe(1)
    expect(report.logsSkippedNoPayment).toBe(1)
  })

  it('sets actionType/source but not domain/company when the payment is gone', async () => {
    await seed()

    await backfillPaymentChangeLogs({ dryRun: false })

    const deleted = await findRaw(idLegacyDeleted)
    expect(deleted.actionType).toBe('UPDATE')
    expect(deleted.source).toBe('single')
    expect(deleted.domainId).toBeUndefined()
    expect(deleted.companyId).toBeUndefined()
  })

  it('leaves already-complete entries untouched', async () => {
    await seed()

    await backfillPaymentChangeLogs({ dryRun: false })

    const complete = await findRaw(idComplete)
    expect(complete.actionType).toBe('CREATE')
    expect(complete.source).toBe('single')
    expect(complete.domainId.toString()).toBe(domains[1]._id)
    expect(complete.companyId.toString()).toBe(realEstates[1]._id)
  })

  it('dry-run reports counts but writes nothing', async () => {
    await seed()

    const report = await backfillPaymentChangeLogs({ dryRun: true })

    expect(report.dryRun).toBe(true)
    expect(report.actionTypeBackfilled).toBe(2)
    expect(report.domainIdBackfilled).toBe(1)

    const live = await findRaw(idLegacyLive)
    expect(live.actionType).toBeUndefined()
    expect(live.source).toBeUndefined()
    expect(live.domainId).toBeUndefined()
  })

  it('is idempotent — a second run backfills nothing', async () => {
    await seed()

    await backfillPaymentChangeLogs({ dryRun: false })
    const second = await backfillPaymentChangeLogs({ dryRun: false })

    expect(second.actionTypeBackfilled).toBe(0)
    expect(second.sourceBackfilled).toBe(0)
    expect(second.domainIdBackfilled).toBe(0)
    expect(second.companyIdBackfilled).toBe(0)
  })
})
