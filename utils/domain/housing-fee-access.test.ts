import { HOUSING_FEE_SERVICE_ID, ServiceType } from '@utils/constants'
import {
  builtInServiceIdsForType,
  findDomainServiceByType,
  hasHousingFeeService,
} from './housing-fee-access'

describe('hasHousingFeeService', () => {
  it('знаходить послугу за serviceType — так виглядає клон у домені', () => {
    // Клонована копія має ВЛАСНИЙ _id, спільним лишається лише serviceType.
    const groups = [
      {
        services: [
          { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', serviceType: 'electricityPrice' },
          { _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', serviceType: 'housingFeePrice' },
        ],
      },
    ]

    expect(hasHousingFeeService(groups)).toBe(true)
  })

  it('знаходить за фіксованим _id — так виглядає старий домен', () => {
    const groups = [{ services: [{ _id: HOUSING_FEE_SERVICE_ID }] }]

    expect(hasHousingFeeService(groups)).toBe(true)
  })

  it('знаходить за fieldName, коли serviceType ще не проставлено', () => {
    const groups = [
      {
        services: [
          { _id: 'cccccccccccccccccccccccc', fieldName: 'housingFeePrice' },
        ],
      },
    ]

    expect(hasHousingFeeService(groups)).toBe(true)
  })

  it('шукає в усіх групах, не лише в першій', () => {
    const groups = [
      { services: [{ _id: 'dddddddddddddddddddddddd' }] },
      { services: [{ serviceType: 'housingFeePrice' }] },
    ]

    expect(hasHousingFeeService(groups)).toBe(true)
  })

  it('false для комунального домену', () => {
    const groups = [
      {
        services: [
          { serviceType: 'electricityPrice' },
          { serviceType: 'waterPrice' },
        ],
      },
    ]

    expect(hasHousingFeeService(groups)).toBe(false)
  })

  it('false на порожньому, відсутньому й покаліченому каталозі', () => {
    expect(hasHousingFeeService([])).toBe(false)
    expect(hasHousingFeeService(null)).toBe(false)
    expect(hasHousingFeeService(undefined)).toBe(false)
    expect(hasHousingFeeService([{ services: null }])).toBe(false)
    expect(hasHousingFeeService([{ services: [null] }])).toBe(false)
  })
})

describe('findDomainServiceByType', () => {
  it('повертає саму послугу, а не лише прапорець', () => {
    const service = {
      _id: 'eeeeeeeeeeeeeeeeeeeeeeee',
      serviceType: 'housingFeePrice',
    }

    expect(
      findDomainServiceByType([{ services: [service] }], ServiceType.HousingFee)
    ).toBe(service)
  })

  it('повертає undefined, якщо типу немає', () => {
    expect(
      findDomainServiceByType(
        [{ services: [{ serviceType: 'waterPrice' }] }],
        ServiceType.HousingFee
      )
    ).toBeUndefined()
  })
})

describe('builtInServiceIdsForType', () => {
  it('повертає фіксований id квартплати', () => {
    expect(builtInServiceIdsForType(ServiceType.HousingFee)).toEqual([
      HOUSING_FEE_SERVICE_ID,
    ])
  })

  it('повертає обидва id для типу, що має кілька вбудованих послуг', () => {
    expect(builtInServiceIdsForType(ServiceType.Water)).toHaveLength(2)
  })

  it('порожній масив для типу без вбудованих послуг', () => {
    expect(builtInServiceIdsForType(ServiceType.Custom)).toEqual([])
  })
})
