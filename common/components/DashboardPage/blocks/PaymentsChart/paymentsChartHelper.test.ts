import { expect } from '@jest/globals'
import {
  extendedPayment,
  extendedPaymentForTestForCorrectValue,
  extendedPaymentsSort,
} from '../mock.data'
import {
  expectedDataForTestForCorrectValue,
  expectedResultData,
  expectedResultDataForTestBySort,
} from './expectedMock.data'
import { getPaymentsChartData } from './paymentsChartHelper'

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
