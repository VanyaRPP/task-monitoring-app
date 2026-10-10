import mongoose from 'mongoose'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates } from '@utils/testData'
import Payment from '@modules/models/Payment'
import { getPayments } from './payment.service'

setupTestEnvironment()

const globalAdmin = {
  isUser: false,
  isDomainAdmin: false,
  isGlobalAdmin: true,
  user: { email: 'ga@example.com' },
}

const addDebit = (invoiceNumber: number, monthService: unknown) =>
  Payment.create({
    invoiceNumber,
    type: 'debit',
    domain: domains[0]._id,
    company: realEstates[0]._id,
    monthService,
    invoiceCreationDate: new Date(Date.UTC(2030, 2, 5)),
    description: '',
    invoice: [],
    generalSum: 0,
    provider: { description: '' },
    reciever: { companyName: '', adminEmails: [], description: '' },
  })

// `monthService` is a Mixed field, so how the id was stored decides whether a
// plain string filter sees it. The previous-readings lookup of the payment
// form filters this way, so an invoice it can't see loses its meter history.
describe('getPayments by month service', () => {
  it('finds invoices whether the id was stored as a string or an ObjectId', async () => {
    const serviceId = new mongoose.Types.ObjectId()
    await addDebit(8001, serviceId.toString())
    await addDebit(8002, serviceId)
    await addDebit(8003, new mongoose.Types.ObjectId().toString())

    const result = await getPayments(
      { serviceIds: serviceId.toString(), limit: '10', skip: '0' },
      globalAdmin
    )

    expect(
      result.data.map(({ invoiceNumber }) => invoiceNumber).sort()
    ).toEqual([8001, 8002])
  })
})
