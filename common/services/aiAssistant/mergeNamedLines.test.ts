import { mergeNamedLines } from './invoiceActions'

// The company's usual rows, as the form seeds them: one catalog service per
// person, priced from last month (names are made up).
const PEOPLE = [
  ['Oleksandra Koval', 3000],
  ['Nataliia Bondar', 2300],
  ['Mariia Tkachenko', 550],
  ['Mykhailo Shevchuk', 4002],
  ['Andrii Moroz', 1500],
  ['Artem Lysenko', 924],
  ['Denys Kravets', 2500],
  ['Iryna Polishchuk', 1200],
  ['Taras Melnyk', 800],
  ['Olena Hrytsenko', 1700],
  ['Bohdan Savchenko', 950],
  ['Yuliia Rudenko', 600],
  ['Roman Zhuk', 1100],
] as const

const rows = PEOPLE.map(([name, price], i) => ({
  type: 'custom',
  name,
  fieldName: `person_${i}`,
  serviceId: `svc-${i}`,
  customService: true,
  amount: 1,
  price,
  sum: price,
}))

// «рахунок за жовтень із полями Andrii $1,980 Artem $924 Denys $2,887.14»
const named = [
  { name: 'Andrii Moroz', sum: 1980 },
  { name: 'Artem Lysenko', sum: 924 },
  { name: 'Denys', sum: 2887.14 },
]

describe('mergeNamedLines', () => {
  it('bills only the named people when the user lists the invoice', () => {
    const result = mergeNamedLines(rows, named, true)

    expect(result.invoice).toEqual([
      expect.objectContaining({
        name: 'Andrii Moroz',
        fieldName: 'person_4',
        price: 1980,
        sum: 1980,
      }),
      expect.objectContaining({
        name: 'Artem Lysenko',
        fieldName: 'person_5',
        sum: 924,
      }),
      expect.objectContaining({
        name: 'Denys Kravets',
        fieldName: 'person_6',
        sum: 2887.14,
      }),
    ])
    expect(result.added).toEqual([])
    expect(result.replaceLines).toBe(true)
  })

  it('reprices the named rows in place instead of adding a second copy', () => {
    const result = mergeNamedLines(rows, named, false)

    expect(result.invoice).toHaveLength(13)
    const artems = result.invoice.filter(({ name }) => name.startsWith('Artem'))
    expect(artems).toHaveLength(1)
    expect(
      result.invoice.find(({ fieldName }) => fieldName === 'person_6').sum
    ).toBe(2887.14)
    expect(result.replaceLines).toBe(true)
  })

  it('adds a line nobody is billed for yet', () => {
    const result = mergeNamedLines(
      rows,
      [{ name: 'Software engineering', quantity: 168, price: 6 }],
      false
    )

    expect(result.invoice).toHaveLength(14)
    expect(result.added).toEqual([
      expect.objectContaining({ amount: 168, price: 6, sum: 1008 }),
    ])
    // Nothing repriced: the form may keep re-seeding and append the line.
    expect(result.replaceLines).toBe(false)
  })

  it("keeps the text next to a line as that line's description", () => {
    const result = mergeNamedLines(
      rows,
      [
        { name: 'Artem Lysenko', sum: 924, description: 'бекенд, жовтень' },
        {
          name: 'Software engineering',
          quantity: 168,
          price: 6,
          description: ' 01-31.10 ',
        },
      ],
      true
    )

    expect(result.invoice).toEqual([
      expect.objectContaining({
        fieldName: 'person_5',
        description: 'бекенд, жовтень',
      }),
      expect.objectContaining({
        name: 'Software engineering',
        description: '01-31.10',
      }),
    ])
  })

  it('leaves a row without a description as it was', () => {
    const result = mergeNamedLines(rows, [{ name: 'Artem Lysenko', sum: 1 }])

    expect(result.invoice[5]).not.toHaveProperty('description')
  })

  it('does not guess between two people of the same first name', () => {
    const withTwoArtems = [
      ...rows,
      { ...rows[5], name: 'Artem Zhuk', fieldName: 'person_13' },
    ]

    const result = mergeNamedLines(
      withTwoArtems,
      [{ name: 'Artem', sum: 1000 }],
      false
    )

    expect(result.added).toEqual([
      expect.objectContaining({ name: 'Artem', sum: 1000 }),
    ])
    expect(result.invoice.filter(({ sum }) => sum === 924)).toHaveLength(2)
  })
})
