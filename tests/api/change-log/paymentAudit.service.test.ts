import { logPaymentMutation } from '@common/modules/services/paymentAudit'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'
import { expect } from '@jest/globals'
import mongoose from 'mongoose'

jest.mock('@common/modules/models/PaymentChangeLog')

describe('paymentAudit - logPaymentMutation', () => {
  const paymentId = new mongoose.Types.ObjectId()
  const domainId = new mongoose.Types.ObjectId()

  const snapshot = {
    _id: paymentId,
    invoiceNumber: 42,
    invoiceCreationDate: new Date('2024-01-01'),
    invoice: [{ sum: 100 }],
    provider: { description: 'p' },
    reciever: { companyName: 'c', adminEmails: [], description: 'd' },
    generalSum: 100,
    description: 'desc',
    type: 'debit',
    domain: domainId,
  }

  const lastCreateArg = () =>
    (PaymentChangeLog.create as jest.Mock).mock.calls[0][0]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})
  })

  it('writes a CREATE log keyed on the after snapshot with invoiceData + domainId', async () => {
    await logPaymentMutation({
      actionType: 'CREATE',
      source: 'single',
      actor: { _id: 'u1', email: 'a@b.com' },
      after: snapshot,
    })

    expect(PaymentChangeLog.create).toHaveBeenCalledTimes(1)
    const arg = lastCreateArg()
    expect(arg.actionType).toBe('CREATE')
    expect(arg.source).toBe('single')
    expect(arg.paymentId).toBe(paymentId)
    expect(arg.actorId).toBe('u1')
    expect(arg.actorEmail).toBe('a@b.com')
    expect(arg.domainId).toBe(domainId)
    expect(arg.before).toBeUndefined()
    expect(arg.after).toMatchObject({ invoiceNumber: 42 })
    expect(arg.invoiceData).toMatchObject({
      invoiceNumber: 42,
      generalSum: 100,
      type: 'debit',
    })
  })

  it('keys a DELETE log on the before snapshot', async () => {
    await logPaymentMutation({
      actionType: 'DELETE',
      source: 'single',
      before: snapshot,
    })

    const arg = lastCreateArg()
    expect(arg.actionType).toBe('DELETE')
    expect(arg.paymentId).toBe(paymentId)
    expect(arg.before).toMatchObject({ invoiceNumber: 42 })
    expect(arg.after).toBeUndefined()
  })

  it('records both before and after for UPDATE, deriving invoiceData from before', async () => {
    const after = { ...snapshot, generalSum: 200 }
    await logPaymentMutation({
      actionType: 'UPDATE',
      source: 'single',
      before: snapshot,
      after,
    })

    const arg = lastCreateArg()
    expect(arg.before.generalSum).toBe(100)
    expect(arg.after.generalSum).toBe(200)
    expect(arg.invoiceData.generalSum).toBe(100)
  })

  it('passes batchId through for BULK_DELETE', async () => {
    const batchId = new mongoose.Types.ObjectId()
    await logPaymentMutation({
      actionType: 'BULK_DELETE',
      source: 'bulk',
      before: snapshot,
      batchId,
    })

    const arg = lastCreateArg()
    expect(arg.actionType).toBe('BULK_DELETE')
    expect(arg.batchId).toBe(batchId)
  })

  it('normalises a Mongoose-like document via toObject()', async () => {
    const doc = { toObject: () => snapshot }
    await logPaymentMutation({
      actionType: 'DELETE',
      source: 'single',
      before: doc,
    })

    expect(lastCreateArg().before).toMatchObject({ invoiceNumber: 42 })
  })

  it('extracts domainId from a populated domain object', async () => {
    await logPaymentMutation({
      actionType: 'DELETE',
      source: 'single',
      before: { ...snapshot, domain: { _id: domainId, name: 'Domain' } },
    })

    expect(lastCreateArg().domainId).toBe(domainId)
  })

  it('does not throw and reports to console when the write fails', async () => {
    ;(PaymentChangeLog.create as jest.Mock).mockRejectedValue(
      new Error('db down')
    )
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(
      logPaymentMutation({
        actionType: 'CREATE',
        source: 'single',
        after: snapshot,
      })
    ).resolves.toBeUndefined()

    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('does nothing when neither before nor after is provided', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

    await logPaymentMutation({ actionType: 'CREATE', source: 'single' })

    expect(PaymentChangeLog.create).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
