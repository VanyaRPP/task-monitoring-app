import { Button, Descriptions, Drawer, Select } from 'antd'
import React, { FC, useMemo, useState } from 'react'
import { ITransaction } from './transactionTypes'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'

interface TransactionDrawerProps {
  transaction: ITransaction
}

const TransactionDrawer: FC<TransactionDrawerProps> = ({ transaction }) => {
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)

  const { data, isLoading, error } = useGetAllPaymentsQuery({
    limit: 1000,
  })

  const transactionAmount = parseFloat(transaction.SUM as string)

  const companies = useMemo(() => {
    if (!data?.data) return []

    const filteredPayments = data.data.filter((payment) => {
      const paymentAmount =
        typeof payment.generalSum === 'string'
          ? parseFloat(payment.generalSum)
          : payment.generalSum

      return paymentAmount === transactionAmount
    })

    return filteredPayments
      .map((payment) => payment.company)
      .filter((company, index, self) =>
        typeof company !== 'string' && company
          ? self.findIndex(
              (c) => (c as IRealestate)?._id === (company as IRealestate)._id
            ) === index
          : false
      ) as IRealestate[]
  }, [data, transactionAmount])

  const showDrawer = () => {
    setDrawerVisible(true)
  }

  const handleCloseDrawer = () => {
    setDrawerVisible(false)
  }

  const handleCompanyChange = (value: string) => {
    setSelectedCompany(value)
  }

  return (
    <>
      <Button type="primary" onClick={showDrawer}>
        View Details
      </Button>
      <Drawer
        title="Transaction Details"
        placement="right"
        onClose={handleCloseDrawer}
        visible={drawerVisible}
        width="70%"
      >
        <Descriptions bordered>
          <Descriptions.Item label="My CRF">
            {transaction.AUT_MY_CRF}
          </Descriptions.Item>
          <Descriptions.Item label="My MFO">
            {transaction.AUT_MY_MFO}
          </Descriptions.Item>
          <Descriptions.Item label="My Account">
            {transaction.AUT_MY_ACC}
          </Descriptions.Item>
          <Descriptions.Item label="My Name">
            {transaction.AUT_MY_NAM}
          </Descriptions.Item>
          <Descriptions.Item label="Counterparty CRF">
            {transaction.AUT_CNTR_CRF}
          </Descriptions.Item>
          <Descriptions.Item label="Counterparty MFO">
            {transaction.AUT_CNTR_MFO}
          </Descriptions.Item>
          <Descriptions.Item label="Counterparty Account">
            {transaction.AUT_CNTR_ACC}
          </Descriptions.Item>
          <Descriptions.Item label="Counterparty Name">
            {transaction.AUT_CNTR_NAM}
          </Descriptions.Item>
          <Descriptions.Item label="Currency">
            {transaction.CCY}
          </Descriptions.Item>
          <Descriptions.Item label="Amount">
            {transaction.SUM}
          </Descriptions.Item>
          <Descriptions.Item label="Description">
            {transaction.OSND}
          </Descriptions.Item>
          <Descriptions.Item label="Date">
            {transaction.DAT_OD}
          </Descriptions.Item>
          <Descriptions.Item label="Company">
            <Select
              placeholder="Select a company"
              onChange={handleCompanyChange}
              value={selectedCompany}
              style={{ width: '100%' }}
              loading={isLoading}
            >
              {companies?.map((company) => (
                <Select.Option key={company._id} value={company._id}>
                  {company.companyName}
                </Select.Option>
              ))}
            </Select>
          </Descriptions.Item>
        </Descriptions>
      </Drawer>
    </>
  )
}

export default TransactionDrawer
