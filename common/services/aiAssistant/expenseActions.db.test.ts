import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, users } from '@utils/testData'
import Profit from '@modules/models/Profit'
import type { UserContext } from '@common/services/paymentService/payment.service'
import { buildExpenseDraft, evaluateProduct } from './expenseActions'

setupTestEnvironment()

const domainAdmin: UserContext = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: users.domainAdmin.email },
}

// The list from the request, as the model is told to pass it.
const list = [
  {
    category: 'Прибирання',
    amount: -2600,
    description: '13 × 200',
    expression: '13*200',
  },
  { category: 'Корпоратив', amount: -3700, description: 'суші, піца' },
  { category: 'Кава-чай', amount: -300, description: 'цукерки' },
  { category: 'Матеріали', amount: -500, description: 'віск' },
  { category: 'Доставка', amount: -145, description: 'посилка косметики' },
]

describe('buildExpenseDraft', () => {
  it('turns the whole list into one record with positive lines and writes nothing', async () => {
    const before = await Profit.countDocuments()

    const { draft, warnings } = await buildExpenseDraft({
      type: 'debit',
      domainId: domains[0]._id,
      items: list,
      ctx: domainAdmin,
    })

    expect(await Profit.countDocuments()).toBe(before)
    expect(warnings).toEqual([])
    expect(draft).toMatchObject({
      type: 'debit',
      scope: { type: 'domain', id: domains[0]._id, label: domains[0].name },
      currency: 'UAH',
    })
    expect(draft.items.map(({ amount }) => amount)).toEqual([
      2600, 3700, 300, 500, 145,
    ])
    // `expression` is a check, not something to store.
    expect(draft.items[0]).toEqual({
      category: 'Прибирання',
      amount: 2600,
      description: '13 × 200',
    })
  })

  it('warns when a line disagrees with its own expression', async () => {
    const { warnings } = await buildExpenseDraft({
      type: 'debit',
      items: [{ category: 'Прибирання', amount: 2500, expression: '13*200' }],
      ctx: domainAdmin,
    })

    expect(warnings).toEqual(['«Прибирання»: 13*200 = 2600, а вказано 2500'])
  })

  it('leaves the target to the form when none was named', async () => {
    const { draft } = await buildExpenseDraft({
      type: 'debit',
      items: [{ amount: 100 }],
      ctx: domainAdmin,
    })

    expect(draft.scope).toBeNull()
  })

  it('refuses a domain the user does not administer', async () => {
    await expect(
      buildExpenseDraft({
        type: 'debit',
        domainId: domains[1]._id,
        items: [{ amount: 100 }],
        ctx: domainAdmin,
      })
    ).rejects.toThrow('domain not accessible')
  })

  it('refuses a company outside the user domains', async () => {
    await expect(
      buildExpenseDraft({
        type: 'debit',
        companyId: realEstates[1]._id,
        items: [{ amount: 100 }],
        ctx: domainAdmin,
      })
    ).rejects.toThrow('company not accessible')
  })

  // A company ledger belongs to the company's own admins - running its
  // domain is not enough, same as the profits API on save.
  it('refuses a company of their domain they do not administer', async () => {
    await expect(
      buildExpenseDraft({
        type: 'debit',
        companyId: realEstates[0]._id,
        items: [{ amount: 100 }],
        ctx: domainAdmin,
      })
    ).rejects.toThrow('company not accessible')
  })

  it('files a company under it for the company own admin', async () => {
    const { draft } = await buildExpenseDraft({
      type: 'debit',
      companyId: realEstates[0]._id,
      items: [{ amount: 100 }],
      ctx: {
        isUser: true,
        isDomainAdmin: false,
        isGlobalAdmin: false,
        user: { email: users.user.email },
      },
    })

    expect(draft.scope).toEqual({
      type: 'company',
      id: realEstates[0]._id,
      label: realEstates[0].companyName,
    })
  })

  it('drops a malformed date and month instead of passing them on', async () => {
    const { draft } = await buildExpenseDraft({
      type: 'debit',
      date: 'вчора',
      periodMonth: '2026-9',
      items: [{ amount: 100 }],
      ctx: domainAdmin,
    })

    expect(draft.date).toBeUndefined()
    expect(draft.periodMonth).toBeUndefined()
  })

  it('rejects a zero line', async () => {
    await expect(
      buildExpenseDraft({
        type: 'debit',
        items: [{ amount: 0 }],
        ctx: domainAdmin,
      })
    ).rejects.toThrow('items[0].amount')
  })
})

describe('evaluateProduct', () => {
  it.each([
    ['13*200', 2600],
    ['13 x 200', 2600],
    ['13 × 200', 2600],
    ['2,5*4', 10],
  ])('%s = %p', (expression, value) => {
    expect(evaluateProduct(expression)).toBe(value)
  })

  it.each([['суші, піца'], ['200+13'], ['']])('ignores %p', (expression) => {
    expect(evaluateProduct(expression)).toBeNull()
  })
})
