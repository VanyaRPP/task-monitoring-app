import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AreaCalculationCard from './DomainAreaCalc';
import { useGetAreasQuery } from '@common/api/domainApi/domain.api';
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api';
import { Form } from 'antd';

jest.mock('@common/api/domainApi/domain.api');
jest.mock('@common/api/realestateApi/realestate.api');

jest.mock('@components/Chart', () => {
  const MockChart = () => <div data-testid="mock-chart" />;
  MockChart.displayName = 'MockChart';
  return MockChart;
});


jest.mock('antd', () => {
  const originalModule = jest.requireActual('antd');
  return {
    ...originalModule,
    Form: {
      ...originalModule.Form,
      useWatch: jest.fn(),
    },
  };
});

describe('AreaCalculationCard Component', () => {
  const mockForm = {
    getFieldValue: jest.fn(),
    setFieldValue: jest.fn(),
  };

  const mockRefetch = jest.fn();

  const mockAreasData = {
    companies: [
      { companyName: 'Company A', totalArea: 10, rentPart: 50 },
      { companyName: 'Company B', totalArea: 10, rentPart: 50 },
    ],
  };

  const mockAllRealEstate = {
    data: [
      { companyName: 'Company A', _id: 'id-1' },
      { companyName: 'Company B', _id: 'id-2' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useGetAreasQuery as jest.Mock).mockReturnValue({
      data: mockAreasData,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch,
    });

    (useGetAllRealEstateQuery as jest.Mock).mockReturnValue({
      data: mockAllRealEstate,
    });

    (Form.useWatch as jest.Mock).mockImplementation((name) => {
      if (name === 'companiesAreas') return mockAreasData.companies.map(c => ({
          _id: 'id',
          name: c.companyName,
          area: c.totalArea,
          rentPart: c.rentPart
      }));
      if (name === 'showAreaDetails') return true;
      return null;
    });
  });

  test('Renders a table with data on load', async () => {
    render(<AreaCalculationCard domainId="123" editable={true} form={mockForm} />);

    expect(screen.getByText('Company A')).toBeInTheDocument();
    expect(screen.getByText('Company B')).toBeInTheDocument();
    
    expect(screen.getByText('20.00 м²')).toBeInTheDocument();
  });

  test('Calls form.setFieldValue on data initialization', async () => {
    mockForm.getFieldValue.mockReturnValue(null);

    render(<AreaCalculationCard domainId="123" editable={true} form={mockForm} />);

    await waitFor(() => {
      expect(mockForm.setFieldValue).toHaveBeenCalledWith('companiesAreas', expect.any(Array));
    });
  });

  test('Calls refetch when clicking the reload button', () => {
    render(<AreaCalculationCard domainId="123" editable={true} form={mockForm} />);

    const reloadButton = screen.getByTestId('reload-button');
    fireEvent.click(reloadButton);

    expect(mockForm.setFieldValue).toHaveBeenCalledWith('companiesAreas', []);
    expect(mockRefetch).toHaveBeenCalled();
  });

  test('Updates form values locally on InputNumber change', () => {
    render(<AreaCalculationCard domainId="123" editable={true} form={mockForm} />);

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '15' } });

    expect(mockForm.setFieldValue).toHaveBeenCalledWith('companiesAreas', expect.arrayContaining([
      expect.objectContaining({ area: 15 })
    ]));
  });
});