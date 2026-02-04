import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompaniesTable from './Table';
import { realEstates, domains, streets, users } from '@utils/testData';
import { IGetRealestateResponse } from '@common/api/realestateApi/realestate.api.types';


jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}));

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useDeleteRealEstateMutation: jest.fn(),
  useUpdateArchivedItemMutation: jest.fn(),
}));

jest.mock('@common/api/filterApi/filter.api', () => ({
  useGetAddressFiltersQuery: jest.fn(),
  useGetDomainFiltersQuery: jest.fn(),
  useGetRealEstateFiltersQuery: jest.fn(),
}));

jest.mock('@common/api/debtorsApi/debtors.api', () => ({
  useGetDebtorsQuery: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockProps = {
  realEstates: {
    data: [],
    success: true,
    domainsFilter: [],
    realEstatesFilter: [],
    streetsFilter: [],
  } as IGetRealestateResponse,
  isLoading: false,
  isError: false,
  filters: {},
  setFilters: jest.fn(),
  setRealEstateActions: jest.fn(),
  realEstateActions: { edit: false },
  isArchive: false,
  customServices: [],
};

describe('CompaniesTable - Column Visibility', () => {
  beforeEach(() => {
    const { useGetCurrentUserQuery } = require('@common/api/userApi/user.api');
    useGetCurrentUserQuery.mockReturnValue({
      data: users.globalAdmin,
    });

    const { useDeleteRealEstateMutation, useUpdateArchivedItemMutation } = require('@common/api/realestateApi/realestate.api');
    useDeleteRealEstateMutation.mockReturnValue([jest.fn(), { isLoading: false }]);
    useUpdateArchivedItemMutation.mockReturnValue([jest.fn(), { isLoading: false }]);

    const { useGetAddressFiltersQuery, useGetDomainFiltersQuery, useGetRealEstateFiltersQuery } = require('@common/api/filterApi/filter.api');
    useGetAddressFiltersQuery.mockReturnValue({ data: { streetsFilter: [] } });
    useGetDomainFiltersQuery.mockReturnValue({ data: { domainsFilter: [] } });
    useGetRealEstateFiltersQuery.mockReturnValue({ data: { realEstatesFilter: [] } });

    const { useGetDebtorsQuery } = require('@common/api/debtorsApi/debtors.api');
    useGetDebtorsQuery.mockReturnValue({ data: { companies: [] } });


    const { useRouter } = require('next/router');
    useRouter.mockReturnValue({
      pathname: '/real-estate',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  test('should display company column when there are multiple unique companies', () => {
    const mockRealEstates: IGetRealestateResponse = {
      data: [
        { ...realEstates[0], 
            domain: { ...domains[0], mfo: '', iban: '', rnokpp: '', IEName: '' } as any, 
            street: { ...streets[0], _v: 1 } as any, companyName: 'Company A', _v: 1, services: [] },
        { ...realEstates[1], 
            domain: { ...domains[1], mfo: '', iban: '', rnokpp: '', IEName: '' } as any, 
            street: { ...streets[1], _v: 1 } as any, companyName: 'Company B', _v: 1, services: [] },
      ],
      success: true,
      domainsFilter: [],
      realEstatesFilter: [],
      streetsFilter: [],
    };

    render(<CompaniesTable {...mockProps} realEstates={mockRealEstates} />);

    expect(screen.getByText('Назва компанії')).toBeInTheDocument();
  });

  test('should hide company column when there is only one unique company', () => {
    const mockRealEstates: IGetRealestateResponse = {
      data: [
        { ...realEstates[0], 
            domain: { ...domains[0], mfo: '', iban: '', rnokpp: '', IEName: '' } as any, 
            street: { ...streets[0], _v: 1 } as any, companyName: 'Company A', _v: 1, services: [] },
        { ...realEstates[1], 
            domain: { ...domains[1], mfo: '', iban: '', rnokpp: '', IEName: '' } as any, 
            street: { ...streets[1], _v: 1 } as any, companyName: 'Company A', _v: 1, services: [] },
      ],
      success: true,
      domainsFilter: [],
      realEstatesFilter: [],
      streetsFilter: [],
    };

    render(<CompaniesTable {...mockProps} realEstates={mockRealEstates} />);

    expect(screen.queryByText('Назва компанії')).not.toBeInTheDocument();
  });

  test('should display company column when data is empty', () => {

    const mockRealEstates: IGetRealestateResponse = {
      data: [],
      success: true,
      domainsFilter: [],
      realEstatesFilter: [],
      streetsFilter: [],
    };

    render(<CompaniesTable {...mockProps} realEstates={mockRealEstates} />);

    expect(screen.getByText('Назва компанії')).toBeInTheDocument();
  });
});

