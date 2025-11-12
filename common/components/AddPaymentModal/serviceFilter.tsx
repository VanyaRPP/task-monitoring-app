export default function serviceFilter(
  invoices: any[],
  domainServices: any[]
): any[] {
  if (!invoices || !domainServices) return []
  const allowedFieldNames = domainServices?.map((s) => s?.fieldName)

  const uniqueInvoices = invoices?.filter((inv) => {
    if (inv?.type !== 'custom') return true

    const duplicateStandardExists = invoices?.some(
      (other) =>
        other !== inv &&
        other?.type !== 'custom' &&
        (other?.type === inv?.fieldName ||
          other?.name === inv?.name ||
          (other?.type === 'maintenancePrice' &&
            inv?.fieldName === 'rentPrice'))
    )

    return !duplicateStandardExists
  })
  return uniqueInvoices?.filter((inv) => {
    if (
      inv?.fieldName === 'waterPrice' ||
      inv?.fieldName === 'waterPriceTotal' ||
      inv?.fieldName === 'rentPart' ||
      inv?.fieldName === 'inflicionPrice' ||
      inv?.fieldName === 'rentPrice'
    ) {
      return false
    }
    const isMaintenance =
      inv?.type === 'maintenancePrice' &&
      allowedFieldNames?.includes('rentPrice')

    const isTypeAllowed = allowedFieldNames?.includes(inv?.type)
    const isFieldNameAllowed =
      inv?.fieldName && allowedFieldNames?.includes(inv?.fieldName)
    const isNameAllowed = inv?.name && allowedFieldNames?.includes(inv?.name)

    return isTypeAllowed || isFieldNameAllowed || isNameAllowed || isMaintenance
  })
}
