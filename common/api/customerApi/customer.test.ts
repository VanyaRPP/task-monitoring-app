/* eslint-disable no-console */
import { jest, test, expect } from '@jest/globals';
import { customerApi, useAddCustomerMutation, useGetAllCustomerQuery } from './customer.api';
import { ICustomer } from './customer.api.types';

jest.mock('./customer.api')
// jest.mock('./customer.api', () => ({
//   useAddCustomerMutation: jest.fn(),
//   useGetAllCustomerQuery: jest.fn(),
// }));

describe('customerApi', () => {
  const mockMutation = useAddCustomerMutation as jest.Mock;
  const mockQuery = useGetAllCustomerQuery as jest.Mock;

  test('addCustomer sends correctly', async () => {
    const newCustomer: ICustomer = {
      customer: "Valix",
      location: "Velyka Berdichevska str.",
      information: "lorem ipsum",
      description: "Not now",
    };

    const mockError = new Error('Incomplete data');
    mockMutation.mockRejectedValueOnce(mockError);

    try {
      await mockMutation(newCustomer);
    } catch (error) {
      expect(mockMutation).toHaveBeenCalledWith(newCustomer);
      expect(error).toBe(mockError);
    }
  });

  test('addCustomer throws an error', () => {
    const invalidCustomer: ICustomer = {
      customer: "///",
      location: "//as",
      information: "asd//",
      description: "asd/asd",
    };

    const mockError = new Error('Incomplete data');
    mockMutation.mockRejectedValueOnce(mockError);

    expect.assertions(2); // use to make sure that have been executed 2 tests 
    return mockMutation(invalidCustomer).catch((error) => {
      expect(mockMutation).toHaveBeenCalledWith(invalidCustomer);
      expect(error).toBe(mockError);
    });
  });

  test('GET limit test', async () => {
    const limitLength = 10;
    const mockResponse = new Array(limitLength).fill({customer:"test"});

    mockQuery.mockReturnValue({ data: mockResponse });

    const response = await useGetAllCustomerQuery({ limit: limitLength });
   
    expect.assertions(3);
    expect(mockQuery).toHaveBeenCalledWith({ limit: limitLength });
    expect(response.data.length).toEqual(limitLength);
    expect(response.data).toEqual(mockResponse);
  });
});
