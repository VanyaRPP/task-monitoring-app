import { ServiceName, ServiceType } from '@utils/constants'

export const expectedResultData = [
  {
    date: '01-12-2023',
    value: 50,
    category: ServiceName[ServiceType.Electricity],
  },
  {
    date: '02-12-2023',
    value: 60,
    category: ServiceName[ServiceType.WaterPart],
  },
  {
    date: '03-12-2023',
    value: 20,
    category: ServiceName[ServiceType.Placing],
  },
]

export const expectedResultDataForTestBySort = [
  {
    date: '04-12-2023',
    value: 213,
    category: ServiceName[ServiceType.WaterPart],
  },
  {
    date: '05-12-2023',
    value: 120,
    category: ServiceName[ServiceType.GarbageCollector],
  },
  {
    date: '06-12-2023',
    value: 89,
    category: ServiceName[ServiceType.Maintenance],
  },
]

export const expectedDataForTestForCorrectValue = [
  {
    date: '08-12-2023',
    value: 60,
    category: ServiceName[ServiceType.Inflicion],
  },
]
