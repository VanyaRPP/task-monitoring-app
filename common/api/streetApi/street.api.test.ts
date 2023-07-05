import { useGetAllStreetsQuery } from './street.api';
import {jest,test,expect} from "@jest/globals";

jest.mock('./street.api', () => ({
  useGetAllStreetsQuery: jest.fn(),
}));

describe('GET', () => {
  const mockStreetQuery = useGetAllStreetsQuery as jest.Mock;

  test('returns 5 values', async () => {
    const mockResponse = new Array(5).fill({});
    const domainId = "admin";

    mockStreetQuery.mockResolvedValueOnce({ data: mockResponse });

    const { data } = await useGetAllStreetsQuery({ domainId });

    expect.assertions(3);
    expect(mockStreetQuery).toHaveBeenCalledWith({ domainId });
    expect(data).toEqual(mockResponse);
    expect(data.length).toEqual(5);
  });
});
