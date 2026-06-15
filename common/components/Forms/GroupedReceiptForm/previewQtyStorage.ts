export const getPreviewQtyStorageKey = (id?: string) =>
  id
    ? `addPayment:showQuantityInPreview:${id}`
    : 'addPayment:showQuantityInPreview:draft'

export function readShowQuantityInPreview(id?: string): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(getPreviewQtyStorageKey(id)) === '1'
}
