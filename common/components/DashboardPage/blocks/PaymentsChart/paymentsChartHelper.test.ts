import { expect } from '@jest/globals'
import { getPaymentsChartData } from './paymentsChartHelper'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { ServiceType } from '@utils/constants'
import {
  extendedPayment,
  extendedPaymentsSort,
  extendedPaymentForTestForCorrectValue,
} from '../mock.data'
import {
  expectedResultData,
  expectedResultDataForTestBySort,
  expectedDataForTestForCorrectValue,
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
