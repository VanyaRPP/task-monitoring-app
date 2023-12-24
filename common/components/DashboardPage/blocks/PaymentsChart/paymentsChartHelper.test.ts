import { expect } from '@jest/globals'
import { getPaymentsChartData } from './paymentsChartHelper';

describe('getPaymentsChartData', () => {
  it('should return empty array', () => {
    expect(getPaymentsChartData(undefined)).toEqual([]);
  });
});