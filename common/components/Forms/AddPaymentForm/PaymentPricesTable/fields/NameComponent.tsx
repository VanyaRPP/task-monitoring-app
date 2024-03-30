import { ServiceType } from '@utils/constants'
import {
  NameGarbageCollectorField,
  NameElectricityField,
  NameMaintainceField,
  NameInflicionField,
  NameWaterPartField,
  NameDiscountField,
  NamePlacingField,
  NameWaterField,
  NameCleaningField,
} from './nameFields'

const fields = {
  [ServiceType.GarbageCollector]: NameGarbageCollectorField,
  [ServiceType.Electricity]: NameElectricityField,
  [ServiceType.Maintenance]: NameMaintainceField,
  [ServiceType.WaterPart]: NameWaterPartField,
  [ServiceType.Inflicion]: NameInflicionField,
  [ServiceType.Discount]: NameDiscountField,
  [ServiceType.Placing]: NamePlacingField,
  [ServiceType.Water]: NameWaterField,
  [ServiceType.Cleaning]: NameCleaningField,
}

export default function NameComponent({ record, preview }) {
  if (record.name in fields) {
    const Component = fields[record.name]
    return (
      <Component
        dateMonth={record.dateMonth}
        company={record.company}
        service={record.service}
        // domain={paymentData?.domain}
        // street={paymentData?.street}
        preview={preview}
      />
    )
  }

  return record.name
}
