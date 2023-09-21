import {
  PriceMaintainceField,
  PricePlacingField,
  PriceElectricityField,
  PriceWaterField,
  PriceGarbageCollectorField,
  PriceInflicionField,
  PriceWaterPartField,
  PriceDiscountField,
  PriceCleaningField,
} from './priceFields'
import { ServiceType } from '@utils/constants'

const fields: any = {
  [ServiceType.Maintenance]: PriceMaintainceField,
  [ServiceType.Placing]: PricePlacingField,
  [ServiceType.Electricity]: PriceElectricityField,
  [ServiceType.Water]: PriceWaterField,
  [ServiceType.GarbageCollector]: PriceGarbageCollectorField,
  [ServiceType.Inflicion]: PriceInflicionField,
  [ServiceType.WaterPart]: PriceWaterPartField,
  [ServiceType.Cleaning]: PriceCleaningField,
  [ServiceType.Discount]: PriceDiscountField,
}

export default function PriceComponent({ record, preview }) {
  if (record.name in fields) {
    const Component = fields[record.name]
    return <Component record={record} preview={preview} />
  }
}
