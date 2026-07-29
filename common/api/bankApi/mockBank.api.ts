import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ITransaction } from '@components/Pages/BankTransactions/components/TransactionsTable/components/transactionTypes'
import { IBalance } from '@components/Pages/BankTransactions/components/DomainbankBalance/DomainBankBalance'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'

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
        balanceOut: '2000',
        nameACC: 'Test Account',
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
    balanceOut: '50000',
    nameACC: 'Тест Т. Є. ФОП',
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
    OSND: 'Сплата за послуги згідно рахунку № 939 від 08.01.2026, Тест Марія Іванівна',
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
    OSND: 'За послуги, Тест Олег Петрович',
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
  // --- AUT_CNTR_CRF fix demo ---------------------------------------------
  // Same payer (tax code 2534567890) pays from two DIFFERENT accounts, and
  // neither matches the account stored on the company (…006). Account and
  // previous matching both fail, so these auto-select only via AUT_CNTR_CRF.
  // Pair them with MOCK_COMPANIES below to verify the fix by hand.
  {
    AUT_MY_CRF: '0000000000',
    AUT_MY_MFO: '300000',
    AUT_MY_ACC: 'UA300000000000000000000000001',
    AUT_MY_NAM: 'Тест Т. Є. ФОП',
    AUT_MY_MFO_NAME: 'АТ КБ "ПРИВАТБАНК"',
    AUT_MY_MFO_CITY: 'ДНІПРО',
    AUT_CNTR_CRF: '2534567890',
    AUT_CNTR_MFO: '300001',
    AUT_CNTR_ACC: 'UA300000000000000000000000004',
    AUT_CNTR_NAM: 'ФОП Тест Платник Іван',
    AUT_CNTR_MFO_NAME: 'АТ "ТЕСТ БАНК"',
    AUT_CNTR_MFO_CITY: 'КИЇВ',
    CCY: 'UAH',
    FL_REAL: 'r',
    PR_PR: 'r',
    DOC_TYP: 'p',
    NUM_DOC: '18',
    DAT_KL: '25.07.2026',
    DAT_OD: '25.07.2026',
    OSND: 'оплата згідно рахунку #1208',
    SUM: '17474.96',
    SUM_E: '17474.96',
    REF: 'HS43Q0725K07W4',
    REFN: 'P',
    TIM_P: '15:07',
    DATE_TIME_DAT_OD_TIM_P: '25.07.2026 15:07:00',
    ID: 'HS43Q0725K07W4P25072026150700C',
    TRANTYPE: 'C',
    DLR: '',
    TECHNICAL_TRANSACTION_ID: 'HS43Q0725K07W4P25072026150700C',
    RECIPIENT_ULTMT_NCEO: '',
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
    AUT_CNTR_CRF: '2534567890',
    AUT_CNTR_MFO: '300001',
    AUT_CNTR_ACC: 'UA300000000000000000000000005',
    AUT_CNTR_NAM: 'КАРТКОВИЙ - ФОП Тест Платник Іван',
    AUT_CNTR_MFO_NAME: 'АТ "ТЕСТ БАНК"',
    AUT_CNTR_MFO_CITY: 'КИЇВ',
    CCY: 'UAH',
    FL_REAL: 'r',
    PR_PR: 'r',
    DOC_TYP: 'p',
    NUM_DOC: '17',
    DAT_KL: '25.07.2026',
    DAT_OD: '25.07.2026',
    OSND: 'РАХУНОК № 1302',
    SUM: '18265.00',
    SUM_E: '18265.00',
    REF: 'HS42Q0725K096B',
    REFN: 'P',
    TIM_P: '15:03',
    DATE_TIME_DAT_OD_TIM_P: '25.07.2026 15:03:00',
    ID: 'HS42Q0725K096BP25072026150300C',
    TRANTYPE: 'C',
    DLR: '',
    TECHNICAL_TRANSACTION_ID: 'HS42Q0725K096BP25072026150300C',
    RECIPIENT_ULTMT_NCEO: '',
    isMatchingPayment: false,
    previousCompanyId: null,
  },
  // Self-transaction: counterparty tax code == owner tax code (0000000000).
  // Must NOT auto-select the owner's own company (guard against false positive).
  {
    AUT_MY_CRF: '0000000000',
    AUT_MY_MFO: '300000',
    AUT_MY_ACC: 'UA300000000000000000000000001',
    AUT_MY_NAM: 'Тест Т. Є. ФОП',
    AUT_MY_MFO_NAME: 'АТ КБ "ПРИВАТБАНК"',
    AUT_MY_MFO_CITY: 'ДНІПРО',
    AUT_CNTR_CRF: '0000000000',
    AUT_CNTR_MFO: '300000',
    AUT_CNTR_ACC: 'UA300000000000000000000000009',
    AUT_CNTR_NAM: 'ТЕСТ ТЕТЯНА ЄВГЕНІВНА',
    AUT_CNTR_MFO_NAME: 'АТ КБ "ПРИВАТБАНК"',
    AUT_CNTR_MFO_CITY: 'ДНІПРО',
    CCY: 'UAH',
    FL_REAL: 'r',
    PR_PR: 'r',
    DOC_TYP: 'p',
    NUM_DOC: '324',
    DAT_KL: '20.05.2026',
    DAT_OD: '20.05.2026',
    OSND: 'повернення коштів',
    SUM: '1560.00',
    SUM_E: '1560.00',
    REF: 'JBKLQ6MOE4R6KZ',
    REFN: '1',
    TIM_P: '17:21',
    DATE_TIME_DAT_OD_TIM_P: '20.05.2026 17:21:00',
    ID: 'JBKLQ6MOE4R6KZ120052026172100D',
    TRANTYPE: 'D',
    DLR: '',
    TECHNICAL_TRANSACTION_ID: 'JBKLQ6MOE4R6KZ120052026172100D',
    isMatchingPayment: false,
    previousCompanyId: null,
  },
]

// Companies to pair with MOCK_TRANSACTIONS when verifying auto-select by hand.
// - "ФОП Тест Платник Іван" has rnokpp === the payer's AUT_CNTR_CRF but a
//   stored account (…006) that differs from both incoming accounts → it can
//   only be matched via AUT_CNTR_CRF (the fix).
// - "Тест Т. Є. ФОП" is the owner's own company; the self-transaction must NOT
//   auto-select it even though its rnokpp equals the counterparty code.
export const MOCK_COMPANIES: IRealestate[] = [
  {
    _id: '64d0e6440fa634ae54087001',
    companyName: 'ФОП Тест Платник Іван',
    rnokpp: '2534567890',
    account: 'UA300000000000000000000000006',
  } as IRealestate,
  {
    _id: '64d0e6440fa634ae54087002',
    companyName: 'Тест Т. Є. ФОП',
    rnokpp: '0000000000',
    account: 'UA300000000000000000000000001',
  } as IRealestate,
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
