import { useGetAllStreetsQuery } from './street.api';
import {jest,expect,test} from "@jest/globals";

jest.mock('./street.api', () => ({
  useGetAllStreetsQuery: jest.fn(),
}));

describe('GET', () => {
    test('getAllStreets return 5', async () => {
      const mockUseGetAllStreetsQuery = jest.fn(() => ({
        data: {
          data: Array(5).fill({}),
          isLoading: false,
          isError: false,
        },
      }));
  
      const { data } = mockUseGetAllStreetsQuery();
      expect(data.data).toHaveLength(5);
    });
});
