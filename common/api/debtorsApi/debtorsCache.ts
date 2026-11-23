export type DebtChange = { companyId: string; debtDelta: number }

type CachedDebtor = { companyId: string; totalDebt: number }

export const applyDebtDeltas = <T extends CachedDebtor>(
  companies: T[],
  changes: DebtChange[]
): T[] => {
  const deltaByCompany = new Map<string, number>()
  for (const { companyId, debtDelta } of changes) {
    deltaByCompany.set(
      companyId,
      (deltaByCompany.get(companyId) ?? 0) + debtDelta
    )
  }

  return companies
    .map((company) => {
      const delta = deltaByCompany.get(company.companyId)
      if (!delta) return company
      return {
        ...company,
        totalDebt: Number((company.totalDebt + delta).toFixed(2)),
      }
    })
    .filter((company) => company.totalDebt !== 0)
}
