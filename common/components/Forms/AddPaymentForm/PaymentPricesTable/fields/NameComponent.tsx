import { Invoice } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable'
import { ServiceType } from '@utils/constants'

export const NameComponent: React.FC<{ record: Invoice }> = ({ record }) => {
  switch (record?.type) {
    case ServiceType.Custom:
      return <Cleaning record={record} />
    case ServiceType.Cleaning:
      return <Cleaning record={record} />
    case ServiceType.Electricity:
      return <Electricity record={record} />
    case ServiceType.Discount:
      return <Discount record={record} />
    case ServiceType.GarbageCollector:
      return <GarbageCollector record={record} />
    case ServiceType.Inflicion:
      return <Inflicion record={record} />
    case ServiceType.Maintenance:
      return <Maintenance record={record} />
    case ServiceType.Placing:
      return <Placing record={record} />
    case ServiceType.Water:
      return <Water record={record} />
    case ServiceType.WaterPart:
      return <WaterPart record={record} />
    default:
      return <Unknown record={record} />
  }
}

const Unknown: React.FC<{ record: Invoice }> = ({ record }) => {
  return <>Unknown</>
}

const Cleaning: React.FC<{ record: Invoice }> = ({ record }) => {
  return <>Прибирання</>
}

const Electricity: React.FC<{ record: Invoice }> = ({ record }) => {
  return <>Електропостачання</>
}

const Discount: React.FC<{ record: Invoice }> = ({ record }) => {
  return <>Знижка</>
}

const GarbageCollector: React.FC<{ record: Invoice }> = ({ record }) => {
  return <>Вивіз ТПВ</>
}

const Inflicion: React.FC<{ record: Invoice }> = ({ record }) => {
  return <>Індекс інфляції</>
}

const Maintenance: React.FC<{ record: Invoice }> = ({ record }) => {
  return <>Утримання</>
}

const Placing: React.FC<{ record: Invoice }> = ({ record }) => {
  return <>Розміщення</>
}

const Water: React.FC<{ record: Invoice }> = ({ record }) => {
  return <>Водопостачання</>
}

const WaterPart: React.FC<{ record: Invoice }> = ({ record }) => {
  return <>Частка водопостачання</>
}
