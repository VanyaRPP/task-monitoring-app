import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { ServiceType } from '@utils/constants'
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
} from './amount'

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

export const AmountComponent: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview = false }) => {
  if (record && record.type in components) {
    return components[record.type]({ record, preview })
  }
  // return <Unknown record={record} preview={preview} />
}
