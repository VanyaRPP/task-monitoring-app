/**
 * @jest-environment node
 */

/**
 * Order of the statement-import plan warnings. One warning per superseded
 * opening balance, in the order the company's payments come back. Until
 * Payment got its company index that was a collection scan - creation order.
 * Runs against in-memory Mongo with the schema indexes built, so a plan change
 * shows up as reordered warnings.
 */

import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose, { Types } from 'mongoose'

import Payment from '@common/modules/models/Payment'
import { testConnectOptions } from '@utils/setupTestEnvironment'
import { Operations } from '@utils/constants'
import { OPENING_BALANCE_FIELD } from '@utils/debt-calculation/prefill'
import { IStatementImport } from '@utils/debt-calculation/statement'
import {
  IImportTarget,
  planCompanyStatementImport,
} from './statementImport.service'

jest.setTimeout(120000)

let mongo: MongoMemoryServer

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } })
  await mongoose.connect(mongo.getUri(), testConnectOptions)
  await Payment.createIndexes()
}, 120000)

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

const domain = new Types.ObjectId()
const company = new Types.ObjectId()

const opening = (month: number, sum: number) => ({
  _id: new Types.ObjectId(),
  type: Operations.Debit,
  domain,
  company,
  invoiceCreationDate: new Date(Date.UTC(2026, month - 1, 1, 12)),
  invoice: [
    { type: 'custom', fieldName: OPENING_BALANCE_FIELD, price: sum, sum },
  ],
  generalSum: sum,
})

const statement: IStatementImport = {
  openingBalance: { year: 2026, month: 1, amount: 1000 },
  months: [1, 2, 3, 4, 5, 6, 7, 8].map((month) => ({
    year: 2026,
    month,
    charged: 100,
    correction: 0,
    paid: 0,
  })),
}

const target = {
  company: { _id: company, domain },
} as unknown as IImportTarget

describe('planCompanyStatementImport - warnings order', () => {
  it('superseded opening balances warn in creation order, not by date', async () => {
    // March is saved first, July second: the company index alone returns
    // July first (invoiceCreationDate descending).
    await Payment.collection.insertMany([opening(3, 1), opening(7, 2)])

    const indexOrder = await Payment.find({ domain, company }).lean()
    expect(
      indexOrder.map((p) => p.invoiceCreationDate.getUTCMonth() + 1)
    ).toEqual([7, 3])

    const plan = await planCompanyStatementImport(target, statement)

    expect(plan.warnings).toHaveLength(2)
    expect(plan.warnings[0]).toContain('Вхідне сальдо 2026-03')
    expect(plan.warnings[1]).toContain('Вхідне сальдо 2026-07')
  })
})
