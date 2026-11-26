import { expect } from '@jest/globals'
import type { IService } from '@common/api/serviceApi/service.api.types'
import { filterByAddress, getAddressOptions, NO_ADDRESS } from './serviceMonths'

describe('addresses', () => {
  const street = { _id: 'street-1', address: 'Шевченка 1', city: 'Житомир' }
  const services = [
    { _id: '3', street },
    { _id: '2' },
    { _id: '1', street },
  ] as IService[]

  it('lists each address once, including the services without one', () => {
    expect(getAddressOptions(services)).toEqual([
      { value: 'street-1', label: 'Шевченка 1 (м. Житомир)' },
      { value: NO_ADDRESS, label: 'Без адреси' },
    ])
  })

  it('keeps the services of one address only', () => {
    expect(filterByAddress(services, 'street-1')).toHaveLength(2)
    expect(filterByAddress(services, NO_ADDRESS)).toEqual([services[1]])
  })
})
