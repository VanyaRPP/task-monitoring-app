import { expect } from '@jest/globals'
import {
  extendedPayment,
  extendedPaymentForTestForCorrectValue,
  extendedPaymentsSort,
} from '../../blocks/mock.data'
import { getPaymentsChartData } from '../utils/paymentsChartHelper'
import {
  expectedDataForTestForCorrectValue,
  expectedResultData,
  expectedResultDataForTestBySort,
} from './expectedMock.data'

describe('getPaymentsChartData', () => {
  it('should return empty array', () => {
    expect(getPaymentsChartData(undefined)).toEqual([])
    expect(getPaymentsChartData(null)).toEqual([])
    expect(getPaymentsChartData([])).toEqual([])
  })
  it('correctly filters and maps payment data by service type and sorted by date', () => {
    expect(getPaymentsChartData(extendedPayment)).toEqual(expectedResultData)
    expect(getPaymentsChartData(extendedPaymentsSort)).toEqual(
      expectedResultDataForTestBySort
    )
    expect(getPaymentsChartData(extendedPaymentForTestForCorrectValue)).toEqual(
      expectedDataForTestForCorrectValue
    )
  })
})
