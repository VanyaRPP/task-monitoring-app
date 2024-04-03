import { ServiceType } from '@utils/constants'
import { Invoice } from '..'
import {
  Cleaning,
  Custom,
  Discount,
  Electricity,
  GarbageCollector,
  Inflicion,
  Maintenance,
  Placing,
  Water,
  WaterPart,
} from './name'

const components = {
  [ServiceType.Cleaning]: Cleaning,
  [ServiceType.Custom]: Custom,
  [ServiceType.Discount]: Discount,
  [ServiceType.Electricity]: Electricity,
  [ServiceType.GarbageCollector]: GarbageCollector,
  [ServiceType.Inflicion]: Inflicion,
  [ServiceType.Maintenance]: Maintenance,
  [ServiceType.Placing]: Placing,
  [ServiceType.Water]: Water,
  [ServiceType.WaterPart]: WaterPart,
}

export const NameComponent: React.FC<{
  record: Invoice
}> = ({ record }) => {
  if (record.type in components) {
    return components[record.type]({ record })
  }

  return <>Unknown</>
}
