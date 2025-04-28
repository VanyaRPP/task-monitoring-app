import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface IBalance {
  acc: string;
  currency: string;
  balanceIn: string;
  balanceInEq: string;
  balanceOut: string;
  balanceOutEq: string; 
  turnoverDebt: string;
  turnoverDebtEq: string;
  turnoverCred: string;
  turnoverCredEq: string;
  bgfIBrnm: string;
  brnm: string;
  dpd: string;
  nameACC: string;
  state: string;
  atp: string;
  flmn: string;
  date_open_acc_reg: string;
  date_open_acc_sys: string;
  date_close_acc: string;
  is_final_bal: boolean;
}

interface IBalancesData {
  exist_next_page: boolean;
  next_page_id: string;
  status: string;
  balances: IBalance[];
}

interface IBankRes<T> {
  data: T;
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
};

export interface ITransaction {
  AUT_MY_CRF: string; 
  AUT_MY_MFO: string;
  AUT_MY_ACC: string;
  AUT_MY_NAM: string;
  AUT_MY_MFO_NAME: string;
  AUT_MY_MFO_CITY: string;
  AUT_CNTR_CRF: string;
  AUT_CNTR_MFO: string;
  AUT_CNTR_ACC: string;
  AUT_CNTR_NAM: string;
  AUT_CNTR_MFO_NAME: string;
  AUT_CNTR_MFO_CITY: string;
  CCY: string;
  FL_REAL: string;
  PR_PR: string;
  DOC_TYP: string;
  NUM_DOC: string;
  DAT_KL: string;
  DAT_OD: string;
  OSND: string;
  SUM: string;
  SUM_E: string;
  REF: string;
  REFN: string;
  TIM_P: string;
  DATE_TIME_DAT_OD_TIM_P: string;
  ID: string;
  TRANTYPE: string;
  DLR: string;
  TECHNICAL_TRANSACTION_ID: string;
  isMatchingPayment?: boolean;
  previousCompanyId?: string;
}

interface ITransactionData {
  exist_next_page: boolean;
  next_page_id: string;
  status: string;
  transactions: ITransaction[];
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
};


export const mockBankApi = createApi({
  reducerPath: 'mockBankApi',
  baseQuery: async () => ({ data: {} }), 
  endpoints: (builder) => ({
    getBalances: builder.query<IBankRes<IBalancesData>, { token: string } | void>({
      query: () => '', 
      transformResponse: () => mockBalances,
    }),
    getTransactions: builder.query<IBankRes<ITransactionData>, { token: string; acc: string }>({
      query: () => '', 
      transformResponse: () => mockTransactions,
    }),
  }),
});


export const { useGetBalancesQuery, useGetTransactionsQuery } = mockBankApi;
