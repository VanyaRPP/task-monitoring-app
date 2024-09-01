/* eslint-disable no-console */
'use client'

import PrivatBankApiAdapter from '@utils/bankUtils/PrivatBankApiAdapter'
import FetchHttpClient from '@utils/FetchHttpClient/FetchHttpClient'
import { Button, Input } from 'antd'
import { useEffect, useState } from 'react'

const BankTransactions = () => {
  const [token, setToken] = useState<string>('')

  const httpClient = new FetchHttpClient({
    baseURL: 'https://acp.privatbank.ua/api',
  })

  async function fetchAndLogTransactionsForDateInterval() {
    const apiPrivatAdapter = new PrivatBankApiAdapter(httpClient, {
      token: token,
      userAgent: window.navigator.userAgent,
    })
    try {
      await apiPrivatAdapter.getBankDates()
      const transactions = await apiPrivatAdapter.getFinalTransactions()
      console.log('!!!!!Fetched transactions for date interval:', transactions)
    } catch (error) {
      console.error('!!!!Error fetching transactions:', error)
    }
  }

  const handleClick = () => {
    if (!token) return console.log('No token')
    fetchAndLogTransactionsForDateInterval()
  }

  return (
    <div>
      <Input
        size="large"
        placeholder="token"
        onChange={(e) => setToken(e.target.value)}
      />
      <Button size="large" type="primary" onClick={handleClick}>
        GO!
      </Button>
      <br />
      <p>Hui Transactions</p>
    </div>
  )
}

export default BankTransactions
