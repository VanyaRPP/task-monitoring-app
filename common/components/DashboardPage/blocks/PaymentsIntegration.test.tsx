import { store } from '@modules/store/store';
import { paymentApi } from '@common/api/paymentApi/payment.api';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import 'whatwg-fetch';

// --- ІМІТАЦІЯ БЕКЕНДУ ---
let mockDatabase = [
  { id: '1', type: 'Debit', debt: 100, amount: 100, status: 'unpaid' }
];

const server = setupServer(
  // 1. Мокаємо отримання списку (щоб перевіряти стан "заборгованості")
  rest.get('*/api/spacehub/payment', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ data: mockDatabase, total: mockDatabase.length })
    );
  }),

  // 2. Мокаємо створення "Оплати" (Кредиту)
  rest.post('*/api/spacehub/payment', async (req, res, ctx) => {
    const body = await req.json();
    
    // Імітуємо логіку бекенду: якщо додали кредит на 100, то закриваємо дебет
    if (body.type === 'Credit') {
        mockDatabase[0].status = 'paid';
        mockDatabase[0].debt = 0; // Заборгованість оновлена
    }
    
    // Також додаємо нову оплату в нашу "базу"
    mockDatabase.push({ ...body, id: Date.now().toString() });

    return res(ctx.status(200), ctx.json({ success: true }));
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  // Повертаємо базу в початковий стан перед кожним кейсом!
  mockDatabase = [{ id: '1', type: 'Debit', debt: 100, amount: 100, status: 'unpaid' }];
  store.dispatch({ type: 'api/resetApiState' }); 
});
afterAll(() => server.close());

// =====================================================================
// САМІ ТЕСТИ: ПЕРЕВІРКА КЕЙСІВ
// =====================================================================

describe('RTK Query Payment Logic (Cache Invalidation)', () => {

  test('Кейс 1: Створити вручну тип кредит. Перевірити оновлення заборгованості', async () => {
    // 1. Ініціалізуємо таблицю (стягуємо початкові дані)
    // Використовуємо .initiate з порожнім об'єктом, імітуючи запит таблиці
    const initialList = await store.dispatch(
      paymentApi.endpoints.getAllPayments.initiate({ limit: 10 } as any)
    ).unwrap();
    
    // Переконуємось, що спочатку є дебет з боргом 100
   expect((initialList as any).data[0].debt).toBe(100);
expect((initialList as any).data[0].status).toBe('unpaid');

    // 2. СТВОРЕННЯ: Користувач додає "Оплату" (Credit)
    await store.dispatch(
      paymentApi.endpoints.addPayment.initiate({
        debt: 100,
        amount: 100,
        type: 'Credit'
      } as any)
    ).unwrap();

    // 3. ПЕРЕВІРКА КЕШУ: RTK Query має 'Payment' tag. 
    // Після addPayment, він має АВТОМАТИЧНО сказати "Кеш старий!" 
    // і ми можемо стягнути оновлені дані.
    const updatedList = await store.dispatch(
      paymentApi.endpoints.getAllPayments.initiate({ limit: 10 } as any, { forceRefetch: true })
    ).unwrap();

    // Перевіряємо, що RTK Query дійсно отримав оновлену заборгованість!
    expect((updatedList as any).data[0].debt).toBe(0);
expect((updatedList as any).data[0].status).toBe('paid');
    
    // Перевіряємо, що нова оплата теж з'явилася в списку
    expect(updatedList.data.length).toBe(2); 
  });


  test('Кейс 2: Позначити оплату (з 3 крапок). Перевірити оновлення заборгованості', async () => {
    // В Redux логіка "з 3 крапок" зазвичай працює через той самий endpoint (addPayment або editPayment).
    // Припустимо, "Позначити оплату" відправляє PATCH запит на зміну статусу.
    // Якщо у вас для цього використовується editPayment - протестуємо його!

    // (Спочатку мокаємо цей PATCH запит для MSW тільки для цього тесту)
    server.use(
        rest.patch('*/api/spacehub/payment/:id', async (req, res, ctx) => {
            mockDatabase[0].status = 'paid';
            mockDatabase[0].debt = 0;
            return res(ctx.status(200), ctx.json({ success: true }));
        })
    );

    // 1. Стягуємо початковий стан
    await store.dispatch(paymentApi.endpoints.getAllPayments.initiate({ limit: 10 } as any)).unwrap();

    // 2. ДІЯ: Користувач тисне "Позначити оплату" в меню 3 крапок. 
    // Зазвичай це виклик editPayment.
    await store.dispatch(
        paymentApi.endpoints.editPayment.initiate({
            _id: '1',
            status: 'paid'
        } as any)
    ).unwrap();

    // 3. ПЕРЕВІРКА КЕШУ: Переконуємось, що залежність спрацювала
    const updatedList = await store.dispatch(
        paymentApi.endpoints.getAllPayments.initiate({ limit: 10 } as any, { forceRefetch: true })
    ).unwrap();

    // Перевіряємо, що борг оновився
    expect((updatedList as any).data[0].debt).toBe(0);
expect((updatedList as any).data[0].status).toBe('paid');
  });

});