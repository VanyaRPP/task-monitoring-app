import { ServiceType } from '@utils/constants'
import {
  AmountGarbageCollectorField,
  AmountTotalAreaField,
  AmountPlacingField,
  AmountInflicionField,
  AmountElectricityField,
  AmountWaterField,
  AmountWaterPartField,
  AmountDiscountField,
} from './amountFields'

const fields: any = {
  [ServiceType.Maintenance]: AmountTotalAreaField,
  [ServiceType.Placing]: AmountPlacingField,
  [ServiceType.Electricity]: AmountElectricityField,
  [ServiceType.Water]: AmountWaterField,
  [ServiceType.GarbageCollector]: AmountGarbageCollectorField,
  [ServiceType.Inflicion]: AmountInflicionField,
  [ServiceType.WaterPart]: AmountWaterPartField,
  [ServiceType.Discount]: AmountDiscountField,
}

export default function AmountComponent({ record, preview, edit }) {
  if (record.name in fields) {
    const Component = fields[record.name]
    return <Component record={record} preview={preview} edit={edit} />
  }
}
