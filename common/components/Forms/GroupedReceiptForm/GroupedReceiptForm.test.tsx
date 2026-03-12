import { render, screen } from '@testing-library/react';
import GroupedReceiptForm from './index';

jest.mock('./style.module.scss', () => ({}));
jest.mock('./templates/style.module.scss', () => ({}));

let template = 'olimp';
jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: () => ({
    template,
    setTemplate: jest.fn(),
    company: {
      currency: 'UAH',
      domain: { name: 'Test Domain', description: 'Test Company\nKyiv' },
    },
  }),
}));

(global as any).ResizeObserver = class {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
};

jest.mock('@components/Forms/GroupedReceiptForm/GroupedPricesTable', () => {
  return {
    __esModule: true,
    default: () => <div>GroupedPricesTable</div>,
  };
});

const mockPayment = {
  invoiceNumber: '123',
  invoiceCreationDate: '2024-01-01',
  reciever: {
    companyName: 'Test Company',
    description: 'Kyiv\nUkraine',
    adminEmails: ['test@gmail.com'],
  },
  provider: { description: 'Provider company' },
  domain: { name: 'Test Domain', description: 'Test Client\nKyiv' },
  invoice: [{ name: 'Development services', price: 100, amount: 1, sum: 100 }],
  generalSum: 100,
};

describe('OLIMP template', () => {
  beforeEach(() => { template = 'olimp'; });

  test('renders invoice header and total', () => {
    render(<GroupedReceiptForm paymentData={mockPayment as any} paymentActions={{ preview: true, edit: true }} />);

    const invoiceHeaders = screen.getAllByText(/INVOICE|РАХУНОК/i);
    expect(invoiceHeaders.length).toBeGreaterThan(0);

    const totals = screen.getAllByText(/TOTAL|ВСЬОГО/i);
    expect(totals.length).toBeGreaterThan(0);
  });

  test('displays main invoice data', () => {
    render(<GroupedReceiptForm paymentData={mockPayment as any} paymentActions={{ preview: true, edit: true }} />);

    const companyElements = screen.getAllByText('Test Company');
    expect(companyElements.length).toBeGreaterThan(0);

    expect(screen.getByText('Development services')).toBeInTheDocument();
    const amounts = screen.getAllByText((content) => content.includes('100.00'));
    expect(amounts[0]).toBeInTheDocument();
  });

  test('service act is hidden', () => {
    render(<GroupedReceiptForm paymentData={mockPayment as any} paymentActions={{ preview: true, edit: true }} />);
    const act = screen.queryByText(/акт надання послуг/i);
    expect(act).not.toBeInTheDocument();
  });
});

describe('Classic template', () => {
  beforeEach(() => { template = 'classic'; });

  test('service act is visible', () => {
    render(
      <GroupedReceiptForm
        paymentData={{
          ...mockPayment,
          reciever: { ...mockPayment.reciever, description: 'ФОП Test\nакт надання послуг' },
        } as any}
        paymentActions={{ preview: true, edit: true }}
      />
    );

    const act = screen.getByText(/акт надання послуг/i);
    expect(act).toBeInTheDocument();
  });
});