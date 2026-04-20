import { ServiceType } from '@utils/constants'

const INVOICE_SERVICE_LABEL_KEY_BY_TYPE: Record<string, string> = {
  [ServiceType.Maintenance]: 'maintenance',
  maintenancePrice: 'maintenance',
  [ServiceType.Placing]: 'placing',
  placingPrice: 'placing',
  rentPrice: 'placing',
  [ServiceType.Inflicion]: 'inflicion',
  inflicionPrice: 'inflicion',
  [ServiceType.Electricity]: 'electricity',
  electricityPrice: 'electricity',
  [ServiceType.Water]: 'water',
  waterPrice: 'water',
  waterPriceTotal: 'water',
  [ServiceType.WaterPart]: 'waterPart',
  waterPart: 'waterPart',
  [ServiceType.GarbageCollector]: 'garbageCollector',
  garbageCollectorPrice: 'garbageCollector',
  [ServiceType.Cleaning]: 'cleaning',
  cleaningPrice: 'cleaning',
  [ServiceType.Discount]: 'discount',
  discount: 'discount',
  [ServiceType.Custom]: 'custom',
  custom: 'custom',
}

export function getInvoiceServiceLabelKey(type: string | undefined): string {
  if (!type) return 'additional'
  return INVOICE_SERVICE_LABEL_KEY_BY_TYPE[type] ?? 'additional'
}
