import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AddPaymentModal from './index';
import { useAddPaymentMutation, useEditPaymentMutation, useGetPaymentNumberQuery } from '@common/api/paymentApi/payment.api';
import { useDispatch, useSelector } from 'react-redux';
import { message } from 'antd';

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

// Мокаем мутации RTK Query
jest.mock('@common/api/paymentApi/payment.api', () => ({
  useAddPaymentMutation: jest.fn(),
  useEditPaymentMutation: jest.fn(),
  useGetPaymentNumberQuery: jest.fn(() => ({ data: 1, isLoading: false })),
  paymentApi: {
    injectEndpoints: jest.fn().mockReturnValue({
      util: { invalidateTags: jest.fn() },
    }),
    util: { invalidateTags: jest.fn() },
  },
}));

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'invoice_number': 'Номер рахунку',
        'invoiceNumber': 'Номер рахунку',
        'generalSum': 'Сума',
        'sum': 'Сума',
        'add': 'Додати',
        'operation': 'Операція',
        'operation_type': 'Операція',
        'domain': 'Домен',
        'street': 'Вулиця',
        'company': 'Компанія',
        'monthService': 'Місяць послуг',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('@common/api/domainApi/domain.api', () => ({
  useGetDomainsQuery: jest.fn(() => ({ data: [], isLoading: false })),
}));

jest.mock('@common/api/streetApi/street.api', () => ({
  useGetAllStreetsQuery: jest.fn(() => ({ data: [], isLoading: false })),
  streetApi: {
    injectEndpoints: jest.fn().mockReturnValue({}),
  },
}));

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useGetAllRealEstateQuery: jest.fn(() => ({ data: { data: [] }, isLoading: false })),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('@common/api/changelogApi/changelog.api', () => ({
  useGetPaymentChangeLogsQuery: jest.fn(() => ({ data: { data: [] }, isLoading: false })),
  useDeletePaymentChangeLogMutation: jest.fn(() => [jest.fn()]),
}));

jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesByDomainQuery: jest.fn(() => ({ data: { data: [] }, isLoading: false })),
  customServicesApi: {
    injectEndpoints: jest.fn().mockReturnValue({}),
  },
}));

jest.mock('@common/api/serviceApi/service.api', () => ({
  useAddServiceMutation: jest.fn(() => [jest.fn()]),
  useGetAllServicesQuery: jest.fn(() => ({ data: { data: [] }, isLoading: false, isError: false })),
  serviceApi: {
    endpoints: {
      getAllServices: {
        initiate: jest.fn(() => ({
          unwrap: jest.fn().mockResolvedValue({ data: [] }),
        })),
      },
    },
  },
}));

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(() => ({ data: {}, isLoading: false })),
}));

// Мокаем usePaymentFormData, чтобы не зависеть от его внутренней логики
jest.mock('@modules/hooks/usePaymentData', () => ({
  usePaymentFormData: jest.fn(() => ({
    company: { _id: 'company1', currency: 'UAH' },
    service: {},
    payment: {},
    prevService: {},
    prevPayment: {},
  })),
}));

// Мокаем message из antd
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@modules/store/hooks', () => ({
  useAppDispatch: jest.fn(() => jest.fn()),
}));

describe('AddPaymentModal Broadcast Channel Logic', () => {
  let mockAddPayment: jest.Mock;
  let mockEditPayment: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // Включаем фейковые таймеры для setTimeout

    const mockDispatch = jest.fn();
    (useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as unknown as jest.Mock).mockImplementation((selector) => selector({
      payments: { filters: {}, currentPage: 1, pageSize: 10 },
      bank: { activeDomainId: '1' },
      user: { user: { roles: [] } }
    }));

    // Сбрасываем экземпляры BroadcastChannelMock перед каждым тестом
    (global.BroadcastChannel as any).instances = [];

    mockAddPayment = jest.fn().mockResolvedValue({ data: { _id: 'newPaymentId' } });
    mockEditPayment = jest.fn().mockResolvedValue({ data: { _id: 'editedPaymentId' } });

    (useAddPaymentMutation as unknown as jest.Mock).mockReturnValue([mockAddPayment, { isLoading: false }]);
    (useEditPaymentMutation as unknown as jest.Mock).mockReturnValue([mockEditPayment, { isLoading: false }]);
    (useGetPaymentNumberQuery as unknown as jest.Mock).mockReturnValue({ data: 1, isLoading: false });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers(); // Запускаем все оставшиеся таймеры
    jest.useRealTimers(); // Возвращаем реальные таймеры
  });

  it('should send PAYMENT_CREATED message and close channel on successful payment addition', async () => {
    render(<AddPaymentModal closeModal={jest.fn()} paymentActions={{ edit: false, preview: false }} />);

    // Дочекаємося рендерингу модального вікна
    const modal = await screen.findByRole('dialog');

    // Використовуємо пошук всередині модалки для більшої надійності
    const invoiceInput = await within(modal).findByRole('textbox', { name: /номер рахунку/i });
    const sumInput = await within(modal).findByRole('textbox', { name: /сума/i }); 

    fireEvent.change(invoiceInput, { target: { value: 'INV-001' } });
    fireEvent.change(sumInput, { target: { value: '100' } });

    // Знаходимо кнопку саме за роллю та назвою
    const submitButton = within(modal).getByRole('button', { name: /додати/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAddPayment).toHaveBeenCalled();
      expect(message.success).toHaveBeenCalledWith('Додано');
    });

    // Проверяем, что BroadcastChannel был создан
    expect((global.BroadcastChannel as any).instances.length).toBe(1);
    const channelInstance = (global.BroadcastChannel as any).instances[0];
    expect(channelInstance.postMessage).toHaveBeenCalledWith('PAYMENT_CREATED');

    // Проверяем, что канал закрывается после setTimeout
    jest.advanceTimersByTime(100);
    expect(channelInstance.close).toHaveBeenCalled();
  });
});