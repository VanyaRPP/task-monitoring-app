// Example
// import FetchHttpClient from '@utils/FetchHttpClient/FetchHttpClient'
// import PrivatBankApiAdapter from './PrivatBankApiAdapter'

// const httpClient = new FetchHttpClient({
//   baseURL: 'https://acp.privatbank.ua/api',
// })

// const apiAdapter = new PrivatBankApiAdapter(httpClient, {
//   userAgent: 'E-ORENDA',
//   token: 'your_token_here',
// })

// async function fetchAndLogTransactionsForDateInterval() {
//   try {
//     const transactions = await apiAdapter.getTransactionsForDateInterval(
//       'account_number',
//       '01-01-2024',
//       '31-01-2024'
//     )
//     console.log('Fetched transactions for date interval:', transactions)
//   } catch (error) {
//     console.error('Error fetching transactions:', error)
//   }
// }

// fetchAndLogTransactionsForDateInterval()
