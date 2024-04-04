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
  WaterPart
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
  edit?: boolean
  preview?: boolean
}> = ({ record, edit = false, preview = false }) => {
  if (record && record.type in components) {
    return components[record.type]({ record, edit, preview })
  }
  // return <Unknown record={record} edit={edit} preview={preview} />
}
