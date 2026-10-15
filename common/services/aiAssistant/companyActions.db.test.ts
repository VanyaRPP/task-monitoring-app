import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, streets, users } from '@utils/testData'
import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import type { UserContext } from '@common/services/paymentService/payment.service'
import { buildCompanyDraft } from './companyActions'

setupTestEnvironment()

// domainAdmin runs domains[0], whose only address is streets[0] (street_0);
// realEstates[0] there is named company_0.
const domainAdmin: UserContext = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: users.domainAdmin.email },
}
const domainId = domains[0]._id

const addLift = async () => {
  const lift = await CustomService.create({
    name: 'Ліфт',
    fieldName: 'lift',
    domain: domainId,
  })
  await Domain.updateOne(
    { _id: domainId },
    { customServices: [{ groupName: 'Будинок', services: [lift._id] }] }
  )
  return lift._id.toString()
}

const draftFor = (input: Record<string, unknown>) =>
  buildCompanyDraft({
    domainId,
    companyName: 'ТОВ Ромашка',
    ctx: domainAdmin,
    ...input,
  })

describe('buildCompanyDraft', () => {
  it('drafts the company from what was said and writes nothing', async () => {
    const liftId = await addLift()
    const before = await RealEstate.countDocuments()

    const result = await draftFor({
      street: 'street_0',
      description: 'Договір 12',
      adminEmails: [' Owner@Romashka.ua ', 'not-an-email'],
      totalArea: 45,
      pricePerMeter: 120,
      contractNumber: '12',
      contractDate: '2026-09-01',
      prices: [
        { name: 'ліфт', price: 12 },
        { name: 'інтернет', price: 200 },
      ],
    })

    expect(await RealEstate.countDocuments()).toBe(before)
    expect(result.draft).toEqual({
      domain: domainId,
      street: streets[0]._id,
      companyName: 'ТОВ Ромашка',
      description: 'Договір 12',
      adminEmails: ['owner@romashka.ua'],
      totalArea: 45,
      pricePerMeter: 120,
      currency: 'UAH',
      contractNumber: '12',
      contractDate: '2026-09-01',
      customServices: [
        { _id: liftId, fieldName: 'lift', label: 'Ліфт', price: 12 },
      ],
    })
    expect(result.unmatched).toEqual(['інтернет'])
    expect(result.invalidEmails).toEqual(['not-an-email'])
    expect(result.similar).toEqual([])
  })

  it('warns about a company of the same name in the domain', async () => {
    const result = await draftFor({ companyName: realEstates[0].companyName })

    expect(result.similar).toEqual([realEstates[0].companyName])
  })

  it('takes a name with regex characters literally', async () => {
    const result = await draftFor({ companyName: 'ФОП (Іванов)' })

    expect(result.similar).toEqual([])
  })

  it('refuses a domain the user does not administer', async () => {
    await expect(draftFor({ domainId: domains[1]._id })).rejects.toThrow(
      'domain not accessible'
    )
  })

  it('needs a name', async () => {
    await expect(draftFor({ companyName: '  ' })).rejects.toThrow(
      'companyName is required'
    )
  })
})
