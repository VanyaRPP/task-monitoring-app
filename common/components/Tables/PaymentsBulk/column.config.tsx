import type { ReactNode } from 'react'
import { CloseCircleOutlined } from '@ant-design/icons'
import TotalArea from './cells/TotalArea'
import CompanyName from './cells/CompanyName'
import { CustomServiceGate } from './cells/CustomServiceGate'
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
  name?: string
  fieldName?: string
  serviceType?: string
}

const SERVICE_TYPE_VALUES = new Set<string>(Object.values(ServiceType))

// Full type resolution, INCLUDING the per-domain `serviceType` tag. Used to pick
// a custom service's Bulk formula (see resolveCustomFormula) — NOT to decide the
// built-in communal columns.
//  - pinned seed _id     → shared seeded services (UTILITY_SERVICE_ID_TO_TYPE)
//  - serviceType         → per-domain typed copies (own _id, set via the form)
//  - fieldName === value → legacy rows whose fieldName already equals the type
export const resolveServiceType = (
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

// Communal type for the built-in Bulk columns — resolved ONLY from a pinned seed
// `_id` or a canonical legacy `fieldName`. Deliberately ignores the per-domain
// `serviceType` tag: such services render as their own custom (formula) columns,
// so they must not ALSO trigger a built-in column (double-render, and — lacking a
// street-service tariff — a mispriced one).
export const resolveCommunalType = (
  service: AllowedService
): ServiceType | undefined => {
  const byId = UTILITY_SERVICE_ID_TO_TYPE[String(service?._id)]
  if (byId) return byId
  if (service?.fieldName && SERVICE_TYPE_VALUES.has(service.fieldName)) {
    return service.fieldName as ServiceType
  }
  return undefined
}

// A per-serviceType column builder. The SAME builder renders both the native
// communal column (fieldName = the ServiceType value) and any per-domain custom
// service tagged with that type (fieldName = the service's own fieldName). One
// implementation per type — add a builder here and both paths pick it up.
type TypedColumnArgs = { title: ReactNode; fieldName: string; losses?: number }
type TypedColumnBuilder = (args: TypedColumnArgs) => TableColumnsType[number]

const withLosses = (title: ReactNode, losses?: number): ReactNode =>
  losses && typeof title === 'string' ? `${title} + Втрати ${losses}%` : title

const electricityColumn: TypedColumnBuilder = ({
  title,
  fieldName,
  losses,
}) => ({
  title: withLosses(title, losses),
  children: [
    {
      title: 'Стара',
      width: 160,
      render: (_, { name }: { name: number }) => (
        <ElectricityAmount name={name} fieldName={fieldName} last />
      ),
    },
    {
      title: 'Нова',
      width: 160,
      render: (_, { name }: { name: number }) => (
        <ElectricityAmount name={name} fieldName={fieldName} />
      ),
    },
    {
      title: 'Втрати',
      width: 200,
      render: (_, { name }: { name: number }) => (
        <LossElectricityPrice name={name} fieldName={fieldName} />
      ),
    },
    {
      title: '',
      width: 200,
      render: (_, { name }: { name: number }) => (
        <LossElectricitySum name={name} fieldName={fieldName} />
      ),
    },
    {
      title: <ElectricitySumTitle />,
      width: 200,
      render: (_, { name }: { name: number }) => (
        <ElectricitySum name={name} fieldName={fieldName} />
      ),
    },
  ],
})

const waterColumn: TypedColumnBuilder = ({ title, fieldName }) => ({
  title,
  children: [
    {
      title: 'Стара',
      width: 160,
      render: (_, { name }: { name: number }) => (
        <WaterAmount name={name} fieldName={fieldName} last />
      ),
    },
    {
      title: 'Нова',
      width: 160,
      render: (_, { name }: { name: number }) => (
        <WaterAmount name={name} fieldName={fieldName} />
      ),
    },
    {
      title: <WaterSumTitle />,
      width: 200,
      render: (_, { name }: { name: number }) => (
        <WaterSum name={name} fieldName={fieldName} />
      ),
    },
  ],
})

const TYPED_COLUMN_BUILDERS: Partial<Record<ServiceType, TypedColumnBuilder>> =
  {
    [ServiceType.Electricity]: electricityColumn,
    [ServiceType.Water]: waterColumn,
  }

/** True when a serviceType has a dedicated formula column (native or custom). */
export const hasTypedColumn = (type: ServiceType | undefined): boolean =>
  !!type && !!TYPED_COLUMN_BUILDERS[type]

/**
 * Builds the formula column for a per-domain custom service by reusing the
 * SAME builder as the native communal column of its serviceType, keyed by the
 * custom service's fieldName. Returns null when the type has no builder yet
 * (caller falls back to the generic Кількість/Ціна pair).
 */
/**
 * Wraps every child cell of a custom column so it only renders on rows whose
 * company actually uses the service (see CustomServiceGate). Applied to both the
 * typed (formula) and the generic (Кількість/Ціна) custom columns.
 */
export const withCompanyGate = (
  column: TableColumnsType[number] | null,
  opts: { serviceKey: string; fieldName?: string }
): TableColumnsType[number] | null => {
  const children = (column as { children?: any[] })?.children
  if (!column || !Array.isArray(children)) return column
  return {
    ...column,
    children: children.map((child) => ({
      ...child,
      render: (value: unknown, record: { name: number }, index: number) => (
        <CustomServiceGate
          name={record?.name}
          serviceKey={opts.serviceKey}
          fieldName={opts.fieldName}
        >
          {child.render?.(value, record, index)}
        </CustomServiceGate>
      ),
    })),
  }
}

export const buildTypedCustomColumn = (
  service: AllowedService,
  opts: { key: string; losses?: number }
): TableColumnsType[number] | null => {
  const type = resolveServiceType(service)
  const builder = type ? TYPED_COLUMN_BUILDERS[type] : undefined
  if (!builder || !opts.key) return null
  // `key` is the unique form/invoice key (the service _id) — NOT the fieldName,
  // which can collide across services whose names differ only in parentheses.
  return builder({
    title: service.name ?? '',
    fieldName: opts.key,
    losses: opts.losses,
  })
}

export const getDefaultColumns = (
  remove: (index: number) => void,
  allowedServices: AllowedService[] = [],
  losses?: number,
  extraColumns: TableColumnsType = []
): TableColumnsType => {
  const allowedTypes = new Set<ServiceType>(
    allowedServices
      .map(resolveCommunalType)
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
    (has(ServiceType.Placing) || has(ServiceType.Maintenance)) && {
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
    has(ServiceType.Electricity) &&
      electricityColumn({
        title: 'Електропостачання',
        fieldName: ServiceType.Electricity,
        losses,
      }),
    has(ServiceType.Water) &&
      waterColumn({ title: 'Водопостачання', fieldName: ServiceType.Water }),
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
    has(ServiceType.Discount) && {
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
