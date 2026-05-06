export function resolveServiceMonth(
  monthService: unknown,
  invoiceCreationDate: Date | string | undefined
): Date | string | undefined {
  if (
    typeof monthService === 'object' &&
    monthService !== null &&
    'date' in monthService &&
    (monthService as { date: unknown }).date
  ) {
    return (monthService as { date: Date | string }).date
  }
  return invoiceCreationDate
}
