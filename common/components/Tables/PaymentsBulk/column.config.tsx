import { CloseCircleOutlined } from '@ant-design/icons'
import TotalArea from './cells/TotalArea'
import CompanyName from './cells/CompanyName'
import { Popconfirm, TableColumnsType } from 'antd'
import { ServiceType, UTILITY_SERVICE_ID_TO_TYPE } from '@utils/constants'

import {
  ElectricityAmount,
  ElectricitySum,
  ElectricitySumTitle,
  LossElectricityPrice,
  LossElectricitySum,
} from './cells/Electricity'
import { MaintenanceSum, MaintenancePrice } from './cells/Maintenance'
import { PlacingSum, PlacingPrice } from './cells/Placing'
import { Cleaning } from './cells/Cleaning'
import { Discount } from './cells/Discount'
import {
  GarbageCollectorSumTitle,
  GarbageCollectorAmount,
  GarbageCollectorSum,
} from './cells/GarbageCollector'
import { InflicionTitle, InflicionSum } from './cells/Inflicion'
import { WaterSumTitle, WaterAmount, WaterSum } from './cells/Water'
import {
  WaterPartSumTitle,
  WaterPartAmount,
  WaterPartSum,
} from './cells/WaterPart'

type AllowedService = {
  _id?: unknown
  fieldName?: string
  serviceType?: string
}

const SERVICE_TYPE_VALUES = new Set<string>(Object.values(ServiceType))

// A catalog entry can carry its "communal" type three different ways, so we
// resolve in priority order. Relying on any single one breaks a real case:
//  - pinned seed _id     → shared seeded services (UTILITY_SERVICE_ID_TO_TYPE)
//  - serviceType         → per-domain typed copies (own _id, set via the form)
//  - fieldName === value → legacy rows whose fieldName already equals the type
// The #1598 cleanup dropped the hardcoded fieldName fallback, so the legacy
// literals (rentPrice, GarbageCollectorAmount, ...) no longer matched anything.
const resolveServiceType = (
  service: AllowedService
): ServiceType | undefined => {
  const byId = UTILITY_SERVICE_ID_TO_TYPE[String(service?._id)]
  if (byId) return byId
  if (service?.serviceType && SERVICE_TYPE_VALUES.has(service.serviceType)) {
    return service.serviceType as ServiceType
  }
  if (service?.fieldName && SERVICE_TYPE_VALUES.has(service.fieldName)) {
    return service.fieldName as ServiceType
  }
  return undefined
}

export const getDefaultColumns = (
  remove: (index: number) => void,
  allowedServices: AllowedService[] = [],
  losses?: number,
  extraColumns: TableColumnsType = []
): TableColumnsType => {
  const allowedTypes = new Set<ServiceType>(
    allowedServices
      .map(resolveServiceType)
      .filter((type): type is ServiceType => Boolean(type))
  )
  const has = (type: ServiceType): boolean => allowedTypes.has(type)

  return [
    {
      fixed: 'left',
      title: 'Компанія',
      width: 250,
      render: (_, { name }: { name: number }) => <CompanyName name={name} />,
    },
    (has(ServiceType.Placing) || has(ServiceType.Maintenance)) && 
    {
      title: 'Площа, м²',
      width: 160,
      render: (_, { name }: { name: number }) => <TotalArea name={name} />,
    },
    has(ServiceType.Maintenance) && {
      title: 'Утримання',
      children: [
        {
          title: 'За м²',
          width: 160,
          render: (_, { name }: { name: number }) => (
            <MaintenancePrice name={name} />
          ),
        },
        {
          title: 'Загальне',
          width: 200,
          render: (_, { name }: { name: number }) => (
            <MaintenanceSum name={name} />
          ),
        },
      ],
    },
    has(ServiceType.Placing) && {
      title: 'Розміщення',
      children: [
        {
          title: 'За м²',
          width: 160,
          render: (_, { name }: { name: number }) => (
            <PlacingPrice name={name} />
          ),
        },
        {
          title: 'Загальне',
          width: 200,
          render: (_, { name }: { name: number }) => <PlacingSum name={name} />,
        },
      ],
    },
    has(ServiceType.Inflicion) && {
      title: <InflicionTitle />,
      width: 200,
      render: (_, { name }: { name: number }) => <InflicionSum name={name} />,
    },
    has(ServiceType.Electricity) && {
      title: losses
        ? `Електропостачання + Втрати ${losses}%`
        : 'Електропостачання',
      children: [
        {
          title: 'Стара',
          width: 160,
          render: (_, { name }: { name: number }) => (
            <ElectricityAmount name={name} last />
          ),
        },
        {
          title: 'Нова',
          width: 160,
          render: (_, { name }: { name: number }) => (
            <ElectricityAmount name={name} />
          ),
        },
        {
          title: 'Втрати',
          width: 200,
          render: (_, { name }: { name: number }) => (
            <LossElectricityPrice name={name} />
          ),
        },
        {
          title: '',
          width: 200,
          render: (_, { name }: { name: number }) => (
            <LossElectricitySum name={name} />
          ),
        },
        {
          title: <ElectricitySumTitle />,
          width: 200,
          render: (_, { name }: { name: number }) => (
            <ElectricitySum name={name} />
          ),
        },
      ],
    },
    has(ServiceType.Water) && {
      title: 'Водопостачання',
      children: [
        {
          title: 'Стара',
          width: 160,
          render: (_, { name }: { name: number }) => (
            <WaterAmount name={name} last />
          ),
        },
        {
          title: 'Нова',
          width: 160,
          render: (_, { name }: { name: number }) => (
            <WaterAmount name={name} />
          ),
        },
        {
          title: <WaterSumTitle />,
          width: 200,
          render: (_, { name }: { name: number }) => <WaterSum name={name} />,
        },
      ],
    },
    has(ServiceType.WaterPart) && {
      title: 'Водопостачання без лічильника',
      children: [
        {
          title: 'Частка, %',
          width: 160,
          render: (_, { name }: { name: number }) => (
            <WaterPartAmount name={name} />
          ),
        },
        {
          title: <WaterPartSumTitle />,
          width: 200,
          render: (_, { name }: { name: number }) => (
            <WaterPartSum name={name} />
          ),
        },
      ],
    },
    has(ServiceType.GarbageCollector) && {
      title: 'Вивіз ТПВ',
      children: [
        {
          title: 'Частка, %',
          width: 160,
          render: (_, { name }: { name: number }) => (
            <GarbageCollectorAmount name={name} />
          ),
        },
        {
          title: <GarbageCollectorSumTitle />,
          width: 200,
          render: (_, { name }: { name: number }) => (
            <GarbageCollectorSum name={name} />
          ),
        },
      ],
    },
    has(ServiceType.Cleaning) && {
      title: 'Прибирання',
      width: 200,
      render: (_, { name }: { name: number }) => <Cleaning name={name} />,
    },
    has(ServiceType.Discount) && 
    {
      title: 'Знижка',
      width: 200,
      render: (_, { name }: { name: number }) => <Discount name={name} />,
    },
    ...extraColumns,
    {
      fixed: 'right',
      align: 'center',
      width: 48,
      render: (_, { name }: { name: number }) => (
        <Popconfirm
          title="Ви впевнені, що хочете видалити запис?"
          okText="Так"
          cancelText="Ні"
          onConfirm={() => remove(name)}
        >
          <CloseCircleOutlined />
        </Popconfirm>
      ),
    },
  ].filter(Boolean) as TableColumnsType
}
