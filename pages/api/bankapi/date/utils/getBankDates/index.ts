import PrivatBankApiAdapter from '@utils/bankUtils/PrivatBankApiAdapter'
import FetchHttpClient from '@utils/FetchHttpClient/FetchHttpClient'

const httpClient = new FetchHttpClient({
  baseURL: 'https://acp.privatbank.ua/api',
})

export async function getBankDates(token: string) {
  const apiPrivatAdapter = new PrivatBankApiAdapter(httpClient, {
    token: token,
  })
  try {
    await apiPrivatAdapter.getBankDates()
    const date = await apiPrivatAdapter.getBankDates()
    return date
  } catch (error) {
    throw new Error(`Error in fetch ${error}`)
  }
}
