import { ServiceType } from '@utils/constants'

const INVOICE_SERVICE_LABEL_KEY_BY_TYPE: Record<string, string> = {
  [ServiceType.Maintenance]: 'maintenance',
  [ServiceType.Placing]: 'placing',
  rentPrice: 'placing',
  [ServiceType.Inflicion]: 'inflicion',
  [ServiceType.Electricity]: 'electricity',
  [ServiceType.Water]: 'water',
  waterPriceTotal: 'water',
  [ServiceType.WaterPart]: 'waterPart',
  [ServiceType.GarbageCollector]: 'garbageCollector',
  [ServiceType.Cleaning]: 'cleaning',
  [ServiceType.Discount]: 'discount',
  [ServiceType.Custom]: 'custom',
}

export function getInvoiceServiceLabelKey(type: string | undefined): string {
  if (!type) return 'additional'
  return INVOICE_SERVICE_LABEL_KEY_BY_TYPE[type] ?? 'additional'
}
