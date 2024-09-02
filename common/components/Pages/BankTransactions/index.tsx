/* eslint-disable no-console */
'use client'

import PrivatBankApiAdapter from '@utils/bankUtils/PrivatBankApiAdapter'
import FetchHttpClient from '@utils/FetchHttpClient/FetchHttpClient'
import { Button, Input } from 'antd'
import { useEffect, useState } from 'react'

const BankTransactions = () => {
  const [token, setToken] = useState<string>('')

  const fetchBankApiDate = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/bankapi/date')

      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      // Parse the response as JSON
      const data = await response.json()

      console.log('Response data:', data)
      return data
    } catch (error) {
      console.error('Error fetching data:', error)
      return null // Return null or handle the error as needed
    }
  }

  const handleClick = () => {
    if (!token) return console.log('No token')
    fetchBankApiDate()
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
