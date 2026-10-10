import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, users } from '@utils/testData'
import Domain from '@modules/models/Domain'
import type { UserContext } from '@common/services/paymentService/payment.service'
import { buildDomainDraft } from './domainActions'

setupTestEnvironment()

const domainAdmin: UserContext = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: users.domainAdmin.email },
}

const IBAN = 'UA213223130000026007233566001'

describe('buildDomainDraft', () => {
  it('drafts the requisites and the description lines, writing nothing', async () => {
    const before = await Domain.countDocuments()

    const result = await buildDomainDraft({
      name: ' ОСББ Сонячне ',
      iban: 'ua21 3223 1300 0002 6007 2335 6600 1',
      rnokpp: '1234 5678',
      description: 'Директор Петренко П.П.',
      adminEmails: ['Buh@Example.com'],
      ctx: domainAdmin,
    })

    expect(await Domain.countDocuments()).toBe(before)
    expect(result.draft).toEqual({
      name: 'ОСББ Сонячне',
      adminEmails: [users.domainAdmin.email, 'buh@example.com'],
      iban: IBAN,
      rnokpp: '12345678',
      // Taken from the IBAN when not named.
      mfo: '322313',
      description: [
        `IBAN: ${IBAN}`,
        'РНОКПП: 12345678',
        'МФО: 322313',
        'Директор Петренко П.П.',
      ].join('\n'),
    })
    expect(result.invalid).toEqual([])
  })

  it('leaves out malformed requisites and reports them', async () => {
    const result = await buildDomainDraft({
      name: 'ОСББ',
      iban: 'UA00 1234',
      rnokpp: '123',
      mfo: '12',
      adminEmails: ['not-an-email'],
      ctx: domainAdmin,
    })

    expect(result.draft).not.toHaveProperty('iban')
    expect(result.draft).not.toHaveProperty('rnokpp')
    expect(result.draft).not.toHaveProperty('mfo')
    expect(result.invalid).toEqual(['iban', 'rnokpp', 'mfo'])
    expect(result.invalidEmails).toEqual(['not-an-email'])
    expect(result.draft.adminEmails).toEqual([users.domainAdmin.email])
  })

  it("warns about a similar name only among the user's own domains", async () => {
    const own = await buildDomainDraft({
      name: domains[0].name.toUpperCase(),
      ctx: domainAdmin,
    })
    expect(own.similar).toEqual([domains[0].name])

    const foreign = await buildDomainDraft({
      name: domains[1].name,
      ctx: domainAdmin,
    })
    expect(foreign.similar).toEqual([])
  })

  it('takes a name with regex characters literally', async () => {
    const result = await buildDomainDraft({
      name: 'ТОВ (Ромашка',
      ctx: domainAdmin,
    })
    expect(result.similar).toEqual([])
  })

  it('requires a name', async () => {
    await expect(
      buildDomainDraft({ name: ' ', ctx: domainAdmin })
    ).rejects.toThrow('name is required')
  })
})
