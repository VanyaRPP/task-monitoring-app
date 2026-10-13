import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, users } from '@utils/testData'
import Street from '@modules/models/Street'
import type { UserContext } from '@common/services/paymentService/payment.service'
import { buildStreetDraft } from './streetActions'

setupTestEnvironment()

// domainAdmin runs domains[0], whose only address is street_0 / street_0_city.
const domainAdmin: UserContext = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: users.domainAdmin.email },
}
const domainId = domains[0]._id

describe('buildStreetDraft', () => {
  it('drafts a new address for the domain, writing nothing', async () => {
    const before = await Street.countDocuments()

    const result = await buildStreetDraft({
      domainId,
      address: ' вул. Шевченка, 5 ',
      city: 'Львів',
      ctx: domainAdmin,
    })

    expect(await Street.countDocuments()).toBe(before)
    expect(result.draft).toEqual({
      domain: domainId,
      address: 'вул. Шевченка, 5',
      city: 'Львів',
    })
    expect(result.existing).toBeNull()
  })

  it('finds an address the domain already has, whatever the spelling', async () => {
    const result = await buildStreetDraft({
      domainId,
      address: 'Street_0',
      city: 'street 0 city',
      ctx: domainAdmin,
    })

    expect(result.existing).toMatchObject({ address: 'street_0' })
  })

  it("does not count another domain's address as existing", async () => {
    const result = await buildStreetDraft({
      domainId,
      address: 'street_1',
      city: 'street_1_city',
      ctx: domainAdmin,
    })

    expect(result.existing).toBeNull()
  })

  it('refuses a domain the user does not administer', async () => {
    await expect(
      buildStreetDraft({
        domainId: domains[1]._id,
        address: 'вул. Шевченка, 5',
        city: 'Львів',
        ctx: domainAdmin,
      })
    ).rejects.toThrow('domain not accessible')
  })

  it('requires the city', async () => {
    await expect(
      buildStreetDraft({
        domainId,
        address: 'вул. Шевченка, 5',
        city: ' ',
        ctx: domainAdmin,
      })
    ).rejects.toThrow('city is required')
  })
})
