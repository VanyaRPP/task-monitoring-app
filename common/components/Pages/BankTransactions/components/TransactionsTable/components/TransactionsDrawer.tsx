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
import React, { FC, useEffect, useMemo, useState } from 'react'
import { ITransaction } from './transactionTypes'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import {
  BankOutlined,
  DoubleRightOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import AddPaymentModal from '@components/AddPaymentModal'
import dayjs from 'dayjs'

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
  const [modalVisible, setModalVisible] = useState(false)

  const transactionAmount = parseFloat(transaction.SUM as string)

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

  const showModal = () => setModalVisible(true)
  const closeModal = () => setModalVisible(false)

  return (
    <>
      <Button
        iconPosition="end"
        icon={<DoubleRightOutlined />}
        type="link"
        onClick={showDrawer}
      >
        GO
      </Button>
      <Drawer
        title="Transaction Details"
        placement="right"
        onClose={handleCloseDrawer}
        open={drawerVisible}
        width="60%"
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
          >
            {relatedCompanies.map((company: IRealestate) => (
              <Select.Option key={company._id} value={company._id}>
                {company.companyName}
              </Select.Option>
            ))}
          </Select>

          <Button
            type="primary"
            disabled={!selectedCompany}
            onClick={showModal}
          >
            Send
          </Button>
        </Space>
      </Drawer>

      {modalVisible && (
        <AddPaymentModal
          closeModal={closeModal}
          paymentData={{
            ...relatedCompanies.find(
              (company: IRealestate) => company._id === selectedCompany
            ),
            generalSum: transactionAmount,
            description: `${transaction.OSND} (taken from the transaction description)`,
            invoiceCreationDate: dayjs(transaction.DAT_OD, 'DD.MM.YYYY'),
            company: selectedCompany,
          }}
          paymentActions={{ edit: false, preview: false }}
        />
      )}
    </>
  )
}

export default TransactionDrawer
