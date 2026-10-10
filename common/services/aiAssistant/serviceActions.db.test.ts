import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, streets, users } from '@utils/testData'
import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import Service from '@modules/models/Service'
import type { UserContext } from '@common/services/paymentService/payment.service'
import { buildServiceDraft, matchTariff } from './serviceActions'

setupTestEnvironment()

// domainAdmin runs domains[0], whose only address is streets[0] (street_0).
const domainAdmin: UserContext = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: users.domainAdmin.email },
}
const domainId = domains[0]._id
const year = 2030

const catalog = [
  { name: 'Електроенергія', fieldName: 'electricityPrice' },
  { name: 'Водопостачання', fieldName: 'waterPrice' },
  { name: 'Вивіз сміття', fieldName: 'garbageCollectorPrice' },
  { name: 'Ліфт', fieldName: 'lift' },
]

const addCatalog = async () => {
  const created = await CustomService.insertMany(
    catalog.map((entry) => ({ ...entry, domain: domainId }))
  )
  await Domain.updateOne(
    { _id: domainId },
    {
      customServices: [
        { groupName: 'Комунальні', services: created.map(({ _id }) => _id) },
      ],
    }
  )
}

const addMonth = (month: number, prices: Record<string, unknown>) =>
  Service.create({
    domain: domainId,
    date: new Date(Date.UTC(year, month - 1, 1, 12)),
    rentPrice: 0,
    electricityPrice: 0,
    waterPrice: 0,
    waterPriceTotal: 0,
    description: '',
    ...prices,
  })

describe('matchTariff', () => {
  it.each([
    ['електрика', 'electricityPrice'],
    ['Світло', 'electricityPrice'],
    ['вода', 'waterPrice'],
    ['вивіз сміття', 'garbageCollectorPrice'],
    ['ліфт', 'lift'],
    ['lift', 'lift'],
  ])('«%s» → %s', (said, fieldName) => {
    expect(matchTariff(said, catalog)?.fieldName).toBe(fieldName)
  })

  it('finds nothing for a tariff the domain does not have', () => {
    expect(matchTariff('інтернет', catalog)).toBeNull()
    expect(matchTariff('утримання', catalog)).toBeNull()
  })

  it('falls back to the standard tariffs for a domain without a catalog', () => {
    expect(matchTariff('утримання', [])?.fieldName).toBe('rentPrice')
  })
})

describe('buildServiceDraft', () => {
  beforeEach(addCatalog)

  it("takes the named tariffs and last month's for the rest, writing nothing", async () => {
    await addMonth(9, {
      electricityPrice: 4,
      waterPrice: 28,
      customServices: [{ fieldName: 'lift', label: 'Ліфт', price: 10 }],
    })
    const before = await Service.countDocuments()

    const draft = await buildServiceDraft({
      domainId,
      month: 10,
      year,
      prices: [
        { name: 'електрика', price: 4.32 },
        { name: 'інтернет', price: 200 },
      ],
      ctx: domainAdmin,
    })

    expect(await Service.countDocuments()).toBe(before)
    expect(draft.mode).toBe('create')
    expect(draft.service).toMatchObject({
      domain: { _id: domainId },
      date: new Date(Date.UTC(year, 9, 1, 12)).toISOString(),
      electricityPrice: 4.32,
      waterPrice: 28,
      lift: 10,
    })
    expect(draft.unmatched).toEqual(['інтернет'])
    const sources = Object.fromEntries(
      draft.lines.map(({ fieldName, source }) => [fieldName, source])
    )
    expect(sources).toMatchObject({
      electricityPrice: 'user',
      waterPrice: 'previous',
      lift: 'previous',
    })
  })

  it('opens an existing month for editing with the new prices', async () => {
    const existing = await addMonth(10, {
      electricityPrice: 4,
      customServices: [{ fieldName: 'lift', label: 'Ліфт', price: 10 }],
    })

    const draft = await buildServiceDraft({
      domainId,
      month: 10,
      year,
      prices: [
        { name: 'ліфт', price: 15 },
        { name: 'вода', price: 31 },
      ],
      ctx: domainAdmin,
    })

    expect(draft.mode).toBe('edit')
    expect(draft.service).toMatchObject({ _id: existing._id.toString() })
    const rows = draft.service.customServices
    expect(rows.find((row) => row.fieldName === 'lift').price).toBe(15)
    expect(rows.find((row) => row.fieldName === 'waterPrice').price).toBe(31)
    expect(await Service.countDocuments({ _id: existing._id })).toBe(1)
  })

  it('finds the address by words and keeps tariffs per address', async () => {
    const draft = await buildServiceDraft({
      domainId,
      street: 'street_0',
      month: 10,
      year,
      prices: [{ name: 'вода', price: 30 }],
      ctx: domainAdmin,
    })

    expect(draft.service.street).toEqual({
      _id: streets[0]._id,
      address: 'street_0',
    })
  })

  it("names the domain's addresses when the one said is unknown", async () => {
    await expect(
      buildServiceDraft({
        domainId,
        street: 'Хрещатик',
        month: 10,
        year,
        prices: [{ name: 'вода', price: 30 }],
        ctx: domainAdmin,
      })
    ).rejects.toThrow('its addresses: street_0')
  })

  it('refuses a domain the user does not administer', async () => {
    await expect(
      buildServiceDraft({
        domainId: domains[1]._id,
        month: 10,
        year,
        prices: [{ name: 'вода', price: 30 }],
        ctx: domainAdmin,
      })
    ).rejects.toThrow('domain not accessible')
  })
})
