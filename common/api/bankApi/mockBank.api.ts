import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ITransaction } from '@components/Pages/BankTransactions/components/TransactionsTable/components/transactionTypes'
import { IBalance } from '@components/Pages/BankTransactions/components/DomainbankBalance/DomainBankBalance'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'

interface IBalancesData {
  exist_next_page: boolean
  next_page_id: string
  status: string
  balances: IBalance[]
}

interface IBankRes<T> {
  data: T
}

const mockBalances: IBankRes<IBalancesData> = {
  data: {
    exist_next_page: false,
    next_page_id: '',
    status: 'success',
    balances: [
      {
        acc: 'UA1234567890',
        currency: 'UAH',
        balanceIn: '5000',
        balanceInEq: '5000',
        balanceOut: '2000',
        balanceOutEq: '2000',
        turnoverDebt: '3000',
        turnoverDebtEq: '3000',
        turnoverCred: '1000',
        turnoverCredEq: '1000',
        bgfIBrnm: 'Kyiv Branch',
        brnm: 'Kyiv Main',
        dpd: '2023-10-01',
        nameACC: 'Dimas',
        state: 'active',
        atp: 'L',
        flmn: 'K123',
        date_open_acc_reg: '2020-01-01',
        date_open_acc_sys: '2020-01-02',
        date_close_acc: '',
        is_final_bal: true,
      },
    ],
  },
}

interface ITransactionData {
  exist_next_page: boolean
  next_page_id: string
  status: string
  transactions: ITransaction[]
}

const mockTransactions: IBankRes<ITransactionData> = {
  data: {
    exist_next_page: false,
    next_page_id: '',
    status: 'success',
    transactions: [
      {
        AUT_MY_CRF: '123456',
        AUT_MY_MFO: '654321',
        AUT_MY_ACC: 'UA1234567890',
        AUT_MY_NAM: 'Dimass',
        AUT_MY_MFO_NAME: 'Bank A',
        AUT_MY_MFO_CITY: 'Kyiv',
        AUT_CNTR_CRF: '789012',
        AUT_CNTR_MFO: '210987',
        AUT_CNTR_ACC: 'UA0987654321',
        AUT_CNTR_NAM: 'Dimas',
        AUT_CNTR_MFO_NAME: 'Bank B',
        AUT_CNTR_MFO_CITY: 'Lviv',
        CCY: 'UAH',
        FL_REAL: '1',
        PR_PR: 'Purchase',
        DOC_TYP: 'Invoice',
        NUM_DOC: 'INV12345',
        DAT_KL: '2023-10-01',
        DAT_OD: '2023-10-02',
        OSND: 'Payment for services',
        SUM: '1000',
        SUM_E: '1000',
        REF: 'REF123',
        REFN: 'REFN456',
        TIM_P: '12:30',
        DATE_TIME_DAT_OD_TIM_P: '2023-10-02T12:30:00Z',
        ID: '1',
        TRANTYPE: 'Deposit',
        DLR: 'N/A',
        TECHNICAL_TRANSACTION_ID: 'TECH123',
        isMatchingPayment: true,
        previousCompanyId: 'COMP001',
      },
    ],
  },
}

export const MOCK_BALANCES: IBalance[] = [
  {
    acc: 'UA300000000000000000000000001',
    currency: 'UAH',
    balanceIn: '150000',
    balanceInEq: '150000',
    balanceOut: '50000',
    balanceOutEq: '50000',
    turnoverDebt: '50000',
    turnoverDebtEq: '50000',
    turnoverCred: '150000',
    turnoverCredEq: '150000',
    bgfIBrnm: '',
    brnm: 'АТ КБ "ПРИВАТБАНК"',
    dpd: '19.01.2026',
    nameACC: 'Тест Т. Є. ФОП',
    state: 'a',
    atp: 'L',
    flmn: '300000',
    date_open_acc_reg: '2020-01-01',
    date_open_acc_sys: '2020-01-01',
    date_close_acc: '',
    is_final_bal: true,
  },
]

export const MOCK_DOMAIN: IExtendedDomain = {
  _id: '64d0e6440fa634ae5408739e',
  _v: 0,
  name: 'ФОП Тест Т.Є.',
  adminEmails: ['test@example.com'],
  streets: [],
  description:
    'ФОП: Тест Т. Є. ФОП\nIBAN: UA300000000000000000000000001\nРНОКПП: 0000000000\nМФО: 300000',
  mfo: '300000',
  iban: 'UA300000000000000000000000001',
  rnokpp: '0000000000',
  IEName: 'Тест Т. Є. ФОП',
  domainBankToken: [],
  customServices: [],
}

export const MOCK_TRANSACTIONS: ITransaction[] = [
  {
    AUT_MY_CRF: '0000000000',
    AUT_MY_MFO: '300000',
    AUT_MY_ACC: 'UA300000000000000000000000001',
    AUT_MY_NAM: 'Тест Т. Є. ФОП',
    AUT_MY_MFO_NAME: 'АТ КБ "ПРИВАТБАНК"',
    AUT_MY_MFO_CITY: 'ДНІПРО',
    AUT_CNTR_CRF: '14360570',
    AUT_CNTR_MFO: '300000',
    AUT_CNTR_ACC: 'UA300000000000000000000000002',
    AUT_CNTR_NAM: 'Транз.рахунок платежi_ DN, DG, DZ',
    AUT_CNTR_MFO_NAME: 'АТ КБ "ПРИВАТБАНК"',
    AUT_CNTR_MFO_CITY: 'ДНІПРО',
    CCY: 'UAH',
    FL_REAL: 'r',
    PR_PR: 'r',
    DOC_TYP: 'm',
    NUM_DOC: '@2PL917714',
    DAT_KL: '19.01.2026',
    DAT_OD: '19.01.2026',
    OSND: 'Сплата за послуги згідно рахунку № 939 від 08.01.2026, Кінцал Юлія Анатоліївна',
    SUM: '4494.63',
    SUM_E: '4494.63',
    REF: 'D3K8Q1JANX690Q',
    REFN: 'P',
    TIM_P: '21:11',
    DATE_TIME_DAT_OD_TIM_P: '19.01.2026 21:11:00',
    ID: 'D3K8Q1JANX690QP19012026211100',
    TRANTYPE: 'C',
    DLR: null,
    TECHNICAL_TRANSACTION_ID: 'D3K8Q1JANX690QP19012026211100',
    isMatchingPayment: false,
    previousCompanyId: null,
  },
  {
    AUT_MY_CRF: '0000000000',
    AUT_MY_MFO: '300000',
    AUT_MY_ACC: 'UA300000000000000000000000001',
    AUT_MY_NAM: 'Тест Т. Є. ФОП',
    AUT_MY_MFO_NAME: 'АТ КБ "ПРИВАТБАНК"',
    AUT_MY_MFO_CITY: 'ДНІПРО',
    AUT_CNTR_CRF: '14360570',
    AUT_CNTR_MFO: '300000',
    AUT_CNTR_ACC: 'UA300000000000000000000000002',
    AUT_CNTR_NAM: 'Транз.рахунок платежi_ DN, DG, DZ',
    AUT_CNTR_MFO_NAME: 'АТ КБ "ПРИВАТБАНК"',
    AUT_CNTR_MFO_CITY: 'ДНІПРО',
    CCY: 'UAH',
    FL_REAL: 'r',
    PR_PR: 'r',
    DOC_TYP: 'm',
    NUM_DOC: '@2PL084365',
    DAT_KL: '03.02.2026',
    DAT_OD: '03.02.2026',
    OSND: 'За послуги, Ісаєв Андрій Миколайович',
    SUM: '4.01',
    SUM_E: '4.01',
    REF: 'D3K0Q23AORYBS4',
    REFN: 'P',
    TIM_P: '21:31',
    DATE_TIME_DAT_OD_TIM_P: '03.02.2026 21:31:00',
    ID: 'D3K0Q23AORYBS4P03022026213100',
    TRANTYPE: 'C',
    DLR: null,
    TECHNICAL_TRANSACTION_ID: 'D3K0Q23AORYBS4P03022026213100',
    isMatchingPayment: false,
    previousCompanyId: null,
  },
  {
    AUT_MY_CRF: '0000000000',
    AUT_MY_MFO: '300000',
    AUT_MY_ACC: 'UA300000000000000000000000001',
    AUT_MY_NAM: 'Тест Т. Є. ФОП',
    AUT_MY_MFO_NAME: 'АТ КБ "ПРИВАТБАНК"',
    AUT_MY_MFO_CITY: 'ДНІПРО',
    AUT_CNTR_CRF: '00000000',
    AUT_CNTR_MFO: '300000',
    AUT_CNTR_ACC: 'UA300000000000000000000000003',
    AUT_CNTR_NAM: 'ЗА ДЕБЕТУВАННЯ РАХУНКУ(UAH)',
    AUT_CNTR_MFO_NAME: 'АТ КБ "ПРИВАТБАНК"',
    AUT_CNTR_MFO_CITY: 'ДНІПРО',
    CCY: 'UAH',
    FL_REAL: 'r',
    PR_PR: 'r',
    DOC_TYP: 'm',
    NUM_DOC: '23OD5NMMDY',
    DAT_KL: '03.02.2026',
    DAT_OD: '03.02.2026',
    OSND: 'Комiсiя за виконання платежiв в нацiональнiй валютi у сумi 82686.07 грн вiд 03.02.2026, згiдно з вiдкритою офертою банку N б/н вiд 30.04.2024 та тарифiв банку, без ПДВ.',
    SUM: '5.00',
    SUM_E: '5.00',
    REF: 'JBKLQ23OD5NMMD',
    REFN: 'Y',
    TIM_P: '22:51',
    DATE_TIME_DAT_OD_TIM_P: '03.02.2026 22:51:00',
    ID: 'JBKLQ23OD5NMMDY03022026225100',
    TRANTYPE: 'D',
    DLR: 'CP7/F6B9LG8=',
    TECHNICAL_TRANSACTION_ID: 'JBKLQ23OD5NMMDY03022026225100',
    isMatchingPayment: false,
    previousCompanyId: null,
  },
]

export const mockBankApi = createApi({
  reducerPath: 'mockBankApi',
  baseQuery: async () => ({ data: {} }),
  endpoints: (builder) => ({
    getBalances: builder.query<
      IBankRes<IBalancesData>,
      { token: string } | void
    >({
      query: () => '',
      transformResponse: () => mockBalances,
    }),
    getTransactions: builder.query<
      IBankRes<ITransactionData>,
      { token: string; acc: string; domainId?: string }
    >({
      query: () => '',
      transformResponse: () => mockTransactions,
    }),
  }),
})

export const { useGetBalancesQuery, useGetTransactionsQuery } = mockBankApi
