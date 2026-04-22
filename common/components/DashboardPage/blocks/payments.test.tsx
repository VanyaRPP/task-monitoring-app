import { render, screen, waitFor } from '@testing-library/react';
import PaymentsBlock from './payments';
import { useDispatch, useSelector } from 'react-redux';
import { paymentApi } from '@common/api/paymentApi/payment.api';

// Mock BroadcastChannel since it is not available in JSDOM environment
class BroadcastChannelMock {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage = jest.fn();
  close = jest.fn();
  static instances: any[] = [];
  constructor(name: string) {
    this.name = name;
    BroadcastChannelMock.instances.push(this);
  }
}
(global as any).BroadcastChannel = BroadcastChannelMock;
(global as any).BroadcastChannel.instances = BroadcastChannelMock.instances;

// Мокаем все RTK Query хуки, используемые в PaymentsBlock
jest.mock('@common/api/filterApi/filter.api', () => ({
  useGetDomainFiltersQuery: jest.fn(() => ({ data: { domainsFilter: [] } })),
  useGetRealEstateFiltersQuery: jest.fn(() => ({ data: { realEstatesFilter: [] } })),
  useGetAddressFiltersQuery: jest.fn(() => ({ data: { streetsFilter: [] } })),
  useGetDateFiltersQuery: jest.fn(() => ({ data: {} })),
}));
jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(() => ({ data: { roles: [] }, isLoading: false, isFetching: false, isError: false })),
}));
jest.mock('@common/api/paymentApi/payment.api', () => ({
  useGetAllPaymentsQuery: jest.fn(() => ({ data: { data: [] }, isError: false, isLoading: false, isFetching: false })),
  useDeletePaymentMutation: jest.fn(() => [jest.fn()]),
  useDeleteMultiplePaymentsMutation: jest.fn(() => [jest.fn()]),
  paymentApi: {
    util: {
      invalidateTags: jest.fn((tags) => ({ type: 'INVALIDATE_TAGS', payload: tags })),
    },
    injectEndpoints: jest.fn().mockReturnValue({}),
  },
}));

jest.mock('@common/api/debtorsApi/debtors.api', () => ({
  useGetDebtorsQuery: jest.fn(() => ({ data: { companies: [] } })),
}));

jest.mock('@common/api/changelogApi/changelog.api', () => ({
  useGetPaymentChangeLogsQuery: jest.fn(() => ({ data: { data: [] }, isLoading: false })),
  useDeletePaymentChangeLogMutation: jest.fn(() => [jest.fn()]),
}));

jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesQuery: jest.fn(() => ({ data: { data: [] }, isLoading: false })),
  customServicesApi: {
    injectEndpoints: jest.fn().mockReturnValue({}),
  },
}));

// Мокаем react-redux
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(() => jest.fn()),
  useSelector: jest.fn(() => ({})),
}));

// Мокаем useRouter
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({ pathname: '/payments' })),
}));

describe('PaymentsBlock Broadcast Channel Sync', () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    (useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);
    (global.BroadcastChannel as any).instances = [];
    // Мокаем useSelector для возврата начального состояния
    (useSelector as unknown as jest.Mock).mockImplementation((selector) => selector({
      payments: {
        filters: {}, domainsFilter: [], companiesFilter: [], streetsFilter: [], dateFilters: {},
        currentPayment: null, edit: false, preview: false, debtorCompanies: [], selectedColumns: [],
        paymentsDeleteItems: [], selectedPayments: [], selectedDateField: null, currentPage: 1, pageSize: 10,
      }
    }));
  });

  it('should dispatch invalidateTags when PAYMENT_CREATED message is received', async () => {
    render(<PaymentsBlock />);

    // Убедимся, что канал был создан
    expect((global.BroadcastChannel as any).instances.length).toBe(1);
    const channelInstance = (global.BroadcastChannel as any).instances[0];

    // Эмулируем получение сообщения
    channelInstance.onmessage({ data: 'PAYMENT_CREATED' });

    // Проверяем, что dispatch был вызван с правильным экшеном
    expect(mockDispatch).toHaveBeenCalledWith(paymentApi.util.invalidateTags(['Payment']));
  });

  it('should close the BroadcastChannel on unmount', () => {
    const { unmount } = render(<PaymentsBlock />);

    expect((global.BroadcastChannel as any).instances.length).toBe(1);
    const channelInstance = (global.BroadcastChannel as any).instances[0];

    unmount();

    expect(channelInstance.close).toHaveBeenCalled();
  });
});