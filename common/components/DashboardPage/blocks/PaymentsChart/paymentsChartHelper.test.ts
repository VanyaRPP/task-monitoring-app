import { expect } from '@jest/globals'
import { getPaymentsChartData } from './paymentsChartHelper';
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types';
import { ServiceType } from '@utils/constants';
import { extendedPayment } from '../mock.data';


describe('getPaymentsChartData', () => {
  it('should return empty array', () => {
    expect(getPaymentsChartData(undefined)).toEqual([]);
    expect(getPaymentsChartData(null)).toEqual([]);
    expect(getPaymentsChartData([])).toEqual([]);
  });
  it('correctly filters and maps payment data by service type and sorted by date', () => {
    const expected = [
      {
        date: '01-12-2023',
        value: 50,
        category: 'Загальна сума',
      },
      {
        date: '02-12-2023',
        value: 60,
        category: 'Загальна сума',
      },
      {
        date: '03-12-2023',
        value: 20,
        category: 'Загальна сума',
      },

      {
        date: '04-12-2023',
        value: 213,
        category: 'Загальна сума',
      },
      {
        date: '05-12-2023',
        value: 120,
        category: 'Загальна сума',
      },
      {
        date: '06-12-2023',
        value: 89,
        category: 'Загальна сума',
      },     
      {
        date: '07-12-2023',
        value: 85,
        category: 'Загальна сума',
      },
      {
        date: '08-12-2023',
        value: 60,
        category: 'Загальна сума',
      },
    ];

    expect(getPaymentsChartData(extendedPayment)).toEqual(expected);
  });
});