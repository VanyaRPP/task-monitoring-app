import { Button, Select, Space } from 'antd'
import React, { FC, useMemo, useState } from 'react'
import { ITransaction } from './transactionTypes'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import AddPaymentModal from '@components/AddPaymentModal'
import dayjs from 'dayjs'
import { SendOutlined } from '@ant-design/icons'

interface TransactionDrawerProps {
  transaction: ITransaction
  domain: IExtendedDomain
}

const TransactionDrawer: FC<TransactionDrawerProps> = ({
  transaction,
  domain,
}) => {
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
  const handleCompanyChange = (value: string) => setSelectedCompany(value)

  const showModal = () => setModalVisible(true)
  const closeModal = () => setModalVisible(false)

  return (
    <>
      <Space.Compact style={{ width: '100%' }}>
        <Select
          placeholder="Select a related company"
          onChange={handleCompanyChange}
          value={selectedCompany}
          style={{ width: 'calc(100% - 80px)' }}
        >
          {relatedCompanies.map((company: IRealestate) => (
            <Select.Option key={company._id} value={company._id}>
              {company.companyName}
            </Select.Option>
          ))}
        </Select>
        <Button
          iconPosition="end"
          icon={<SendOutlined />}
          type="primary"
          onClick={showModal}
          disabled={!selectedCompany}
        >
          Send
        </Button>
      </Space.Compact>
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
            domain: domain,
          }}
          paymentActions={{ edit: false, preview: false }}
        />
      )}
    </>
  )
}

export default TransactionDrawer
