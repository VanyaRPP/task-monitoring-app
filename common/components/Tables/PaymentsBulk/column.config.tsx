import { CloseCircleOutlined } from '@ant-design/icons'
import TotalArea from './cells/TotalArea'
import CompanyName from './cells/CompanyName'
import { Popconfirm, TableColumnsType } from 'antd'

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

export const getDefaultColumns = (
  remove: (index: number) => void,
  _allowedServices: any,
  losses?: number,
  extraColumns: TableColumnsType = [],
  service?: any
): TableColumnsType =>
  [
    {
      fixed: 'left',
      title: 'Компанія',
      width: 250,
      render: (_, { name }: { name: number }) => <CompanyName name={name} />,
    },
    {
      title: 'Площа, м²',
      width: 160,
      render: (_, { name }: { name: number }) => <TotalArea name={name} />,
    },
    _allowedServices.some((inv) => inv?.fieldName === 'rentPrice') && {
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
    _allowedServices.some((inv) => inv?.fieldName === 'placingPrice') && {
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
    _allowedServices.some((inv) => inv?.fieldName === 'inflicionPrice') && {
      title: <InflicionTitle />,
      width: 200,
      render: (_, { name }: { name: number }) => <InflicionSum name={name} />,
    },
_allowedServices.some((inv) => inv?.fieldName === 'electricityPrice' || inv?.name?.toLowerCase().includes('електро')) && {
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
    _allowedServices.some((inv) => inv?.fieldName === 'waterPrice') && {
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
    _allowedServices.some((inv) => inv?.fieldName === 'waterPartAmount') && {
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
    _allowedServices.some(
      (inv) => inv?.fieldName === 'GarbageCollectorAmount'
    ) && {
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
    _allowedServices.some((inv) => inv?.fieldName === 'Cleaning') && {
      title: 'Прибирання',
      width: 200,
      render: (_, { name }: { name: number }) => <Cleaning name={name} />,
    },
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
