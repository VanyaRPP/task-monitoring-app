import { applyDebtDeltas } from './debtorsCache'

const debtor = (companyId: string, totalDebt: number) => ({
  companyId,
  companyName: companyId,
  totalDebt,
})

describe('applyDebtDeltas', () => {
  it('reduces a positive debt when a payment is marked paid', () => {
    const result = applyDebtDeltas(
      [debtor('company1', 1000)],
      [{ companyId: 'company1', debtDelta: -300 }]
    )

    expect(result).toEqual([expect.objectContaining({ totalDebt: 700 })])
  })

  it('flips a company into a negative debt when it overpays', () => {
    const result = applyDebtDeltas(
      [debtor('company1', 200)],
      [{ companyId: 'company1', debtDelta: -500 }]
    )

    expect(result).toEqual([expect.objectContaining({ totalDebt: -300 })])
  })

  it('keeps an already negative debt and deepens it', () => {
    const result = applyDebtDeltas(
      [debtor('company1', -300)],
      [{ companyId: 'company1', debtDelta: -200 }]
    )

    expect(result).toEqual([expect.objectContaining({ totalDebt: -500 })])
  })

  it('brings a negative debt back towards zero and drops it once settled', () => {
    const result = applyDebtDeltas(
      [debtor('company1', -300)],
      [{ companyId: 'company1', debtDelta: 300 }]
    )

    expect(result).toEqual([])
  })

  it('drops a positive debt once it is settled', () => {
    const result = applyDebtDeltas(
      [debtor('company1', 300)],
      [{ companyId: 'company1', debtDelta: -300 }]
    )

    expect(result).toEqual([])
  })

  it('does not leave a float remainder behind as a phantom debt', () => {
    const result = applyDebtDeltas(
      [debtor('company1', 0.3)],
      [{ companyId: 'company1', debtDelta: -0.1 - 0.2 }]
    )

    expect(result).toEqual([])
  })

  it('accumulates several deltas for the same company', () => {
    const result = applyDebtDeltas(
      [debtor('company1', 1000)],
      [
        { companyId: 'company1', debtDelta: -400 },
        { companyId: 'company1', debtDelta: -900 },
      ]
    )

    expect(result).toEqual([expect.objectContaining({ totalDebt: -300 })])
  })

  it('keeps both debt directions and removes only settled companies', () => {
    const result = applyDebtDeltas(
      [
        debtor('company1', 1000),
        debtor('company2', -500),
        debtor('company3', 250),
      ],
      [
        { companyId: 'company1', debtDelta: -1500 },
        { companyId: 'company3', debtDelta: -250 },
      ]
    )

    expect(result).toEqual([
      expect.objectContaining({ companyId: 'company1', totalDebt: -500 }),
      expect.objectContaining({ companyId: 'company2', totalDebt: -500 }),
    ])
  })

  it('leaves untouched companies as-is', () => {
    const companies = [debtor('company1', 1000), debtor('company2', -500)]

    expect(applyDebtDeltas(companies, [])).toEqual(companies)
    expect(
      applyDebtDeltas(companies, [{ companyId: 'unknown', debtDelta: 100 }])
    ).toEqual(companies)
  })
})
