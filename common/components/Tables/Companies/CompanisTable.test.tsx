import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompaniesTable from './Table';
import { IGetRealestateResponse } from '@common/api/realestateApi/realestate.api.types';
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api';
import { useGetAddressFiltersQuery, useGetDomainFiltersQuery, useGetRealEstateFiltersQuery } from '@common/api/filterApi/filter.api';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}));

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useDeleteRealEstateMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useUpdateArchivedItemMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
}));

const mockFilterData = {
  streetsFilter: [],
  domainsFilter: [],
  realEstatesFilter: [],
};

jest.mock('@common/api/filterApi/filter.api', () => ({
  useGetAddressFiltersQuery: jest.fn(() => ({ data: mockFilterData })),
  useGetDomainFiltersQuery: jest.fn(() => ({ data: mockFilterData })),
  useGetRealEstateFiltersQuery: jest.fn(() => ({ data: mockFilterData })),
}));

jest.mock('@common/api/debtorsApi/debtors.api', () => ({
  useGetDebtorsQuery: jest.fn(() => ({ data: { companies: [] } })),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    pathname: '/real-estate',
  })),
}));

const mockRealEstatesData = [
  { _id: '1', companyName: 'Company A', domain: { name: 'Domain 1' }, street: { address: 'Street 1', city: 'City 1' }, adminEmails: [] },
  { _id: '2', companyName: 'Company B', domain: { name: 'Domain 2' }, street: { address: 'Street 2', city: 'City 2' }, adminEmails: [] },
];

const mockProps = {
  realEstates: {
    data: mockRealEstatesData,
    success: true,
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

describe('CompaniesTable', () => {
  beforeEach(() => {
    (useGetCurrentUserQuery as jest.Mock).mockReturnValue({
      data: { roles: ['global_admin'] },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should display company column when multiple companies are available in filters', () => {
    const multipleCompanies = { realEstatesFilter: [{ value: '1' }, { value: '2' }] };
    (useGetRealEstateFiltersQuery as jest.Mock).mockReturnValue({
      data: multipleCompanies,
    });

    render(<CompaniesTable {...mockProps} />);
    expect(screen.getByText('Назва компанії')).toBeInTheDocument();
  });

  test('should hide company column when only one company is available in filters', () => {
    const singleCompany = { realEstatesFilter: [{ value: '1' }] };
    (useGetRealEstateFiltersQuery as jest.Mock).mockReturnValue({
      data: singleCompany,
    });

    render(<CompaniesTable {...mockProps} />);
    expect(screen.queryByText('Назва компанії')).not.toBeInTheDocument();
  });

  test('should hide domain column when only one domain is available in filters', () => {
    const singleDomain = { domainsFilter: [{ value: 'd1' }] };
    (useGetDomainFiltersQuery as jest.Mock).mockReturnValue({
      data: singleDomain,
    });

    render(<CompaniesTable {...mockProps} />);
    expect(screen.queryByText('Надавач послуг')).not.toBeInTheDocument();
  });

  test('should render error alert when isError is true', () => {
    render(<CompaniesTable {...mockProps} isError={true} />);
    expect(screen.getByText('Помилка')).toBeInTheDocument();
  });

  test('should render loading state', () => {
    render(<CompaniesTable {...mockProps} isLoading={true} />);
    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
  });
});
