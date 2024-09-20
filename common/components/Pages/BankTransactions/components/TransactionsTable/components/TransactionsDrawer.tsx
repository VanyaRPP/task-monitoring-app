import {
  Button,
  Descriptions,
  Divider,
  Drawer,
  Select,
  Typography,
  Space,
  Row,
  Col,
} from 'antd'
import React, { FC, useMemo, useState } from 'react'
import { ITransaction } from './transactionTypes'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { BankOutlined, ShopOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface TransactionDrawerProps {
  transaction: ITransaction
  domain: IExtendedDomain
}

const TransactionDrawer: FC<TransactionDrawerProps> = ({
  transaction,
  domain,
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)

  const { data, isLoading } = useGetAllPaymentsQuery({ limit: 1000 })
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

  const { data: realEstatesData } = useGetAllRealEstateQuery({
    domainId: domain._id,
  })

  const relatedCompanies = useMemo(
    () => realEstatesData?.data || [],
    [realEstatesData]
  )

  const showDrawer = () => setDrawerVisible(true)
  const handleCloseDrawer = () => setDrawerVisible(false)
  const handleCompanyChange = (value: string) => setSelectedCompany(value)

  return (
    <>
      <Button type="primary" onClick={showDrawer}>
        View Details
      </Button>
      <Drawer
        title="Transaction Details"
        placement="right"
        onClose={handleCloseDrawer}
        open={drawerVisible}
        width="60%"
        bodyStyle={{ padding: '24px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Title level={4}>
            <BankOutlined /> Transaction Info
          </Title>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>Counterparty CRF:</Text>
              <br />
              <Text>{transaction.AUT_CNTR_CRF}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Counterparty MFO:</Text>
              <br />
              <Text>{transaction.AUT_CNTR_MFO}</Text>
            </Col>

            <Col span={12}>
              <Text strong>Counterparty Account:</Text>
              <br />
              <Text>{transaction.AUT_CNTR_ACC}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Counterparty Name:</Text>
              <br />
              <Text>{transaction.AUT_CNTR_NAM}</Text>
            </Col>
          </Row>

          <Divider />

          <Text strong>Description:</Text>
          <Text>{transaction.OSND}</Text>

          <Divider />

          <Text strong>Amount:</Text>
          <Text>{transaction.SUM}</Text>

          <Divider />

          <Title level={4}>
            <ShopOutlined /> Related Company
          </Title>
          <Text strong>Select Company:</Text>
          <Select
            placeholder="Select a related company"
            onChange={handleCompanyChange}
            value={selectedCompany}
            style={{ width: '100%' }}
            loading={isLoading}
          >
            {relatedCompanies.map((company: IRealestate) => (
              <Select.Option key={company._id} value={company._id}>
                {company.companyName}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </Drawer>
    </>
  )
}

export default TransactionDrawer
