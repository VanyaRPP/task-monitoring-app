import { EditOutlined, SettingOutlined } from '@ant-design/icons'
import {
  IDomainBankToken,
  IExtendedDomain,
} from '@common/api/domainApi/domain.api.types'
import EncryptionService from '@utils/encryptionService'
import { Button, Card, Input, Row } from 'antd'

import React, { FC, useEffect, useState } from 'react'
import TransactionsTable from '../TransactionsTable/TransactionsTable'

interface Props {
  domain: IExtendedDomain
}

const DomainBankTab: FC<Props> = ({ domain }) => {
  const { Meta } = Card
  const { TextArea } = Input

  const SECURE_TOKEN = process.env.NEXT_PUBLIC_MONGODB_SECRET_TOKEN

  const encryptionService = new EncryptionService(SECURE_TOKEN)

  const token = domain?.domainBankToken[0]
    ? encryptionService.decrypt(domain?.domainBankToken[0]?.token)
    : ''

  const [tr, setTr] = useState([])
  const fetchBankApiDate = async () => {
    try {
      const response = await fetch(
        'http://localhost:3000/api/bankapi/transactions',
        {
          headers: {
            token: token,
            'Content-type': 'application/json;charset=utf-8',
          },
        }
      )

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

  const fetchBankApiDateDate = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/bankapi/date', {
        headers: {
          token: token,
          'Content-type': 'application/json;charset=utf-8',
        },
      })

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
    fetchBankApiDate().then((res) => {
      console.log(res, 'res')
      setTr(res.data.transactions)
    })
  }

  const viewTokens = (domainBankToken) => {
    return (
      <Row
        wrap={false}
        style={{ overflowX: 'scroll', gap: '1rem', paddingTop: '1rem' }}
      >
        {domain?.domainBankToken.length
          ? domainBankToken.map((token: IDomainBankToken) => {
              return (
                <Card
                  key={token.shortToken}
                  size="small"
                  title={token.name}
                  style={{ width: '300px' }}
                  actions={[
                    <SettingOutlined key="setting" />,
                    <EditOutlined key="edit" />,
                  ]}
                >
                  <Input value={token.shortToken} disabled />
                </Card>
              )
            })
          : 'No bank config add token'}
      </Row>
    )
  }

  return (
    <Card>
      <Meta
        title={domain.name}
        description={<TextArea rows={4} value={domain.description} disabled />}
      />
      {viewTokens(domain.domainBankToken)}

      <Button onClick={handleClick}>DO</Button>
      <Button onClick={() => fetchBankApiDateDate()}>date</Button>

      <br />
      <TransactionsTable transactions={tr} />
    </Card>
  )
}

export default DomainBankTab
