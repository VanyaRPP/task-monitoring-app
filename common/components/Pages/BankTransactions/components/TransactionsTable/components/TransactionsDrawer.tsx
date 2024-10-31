import { Badge, Button, Select, Space } from 'antd'
import React, { FC, useEffect, useMemo, useState } from 'react'
import { ITransaction } from './transactionTypes'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import AddPaymentModal from '@components/AddPaymentModal'
import dayjs from 'dayjs'
import { SendOutlined } from '@ant-design/icons'
import { useCompareTransactionQuery } from '@common/api/paymentApi/payment.api'

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
  const [selectedPayment, setSelectedPayment] = useState<any>(null)

  const transactionAmount = parseFloat(transaction.SUM as string)

  const { data: compareRes, isLoading } = useCompareTransactionQuery({
    description: transaction.OSND,
    counterpartyName: transaction.AUT_CNTR_NAM,
  })

  useEffect(() => {
    if (compareRes?.matchingPayments?.length) {
      if (compareRes.matchingPayments.length === 1) {
        setSelectedPayment(compareRes.matchingPayments[0])
      } else {
        const minInvoicePayment = compareRes.matchingPayments.reduce(
          (minPayment, currentPayment) =>
            currentPayment.invoiceNumber < minPayment.invoiceNumber
              ? currentPayment
              : minPayment,
          compareRes.matchingPayments[0]
        )
        setSelectedPayment(minInvoicePayment)
      }
    }
  }, [compareRes])

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
      <Badge.Ribbon
        text="Платіж є"
        color="purple"
        style={{
          top: '-50%',
          visibility:
            selectedCompany || !compareRes?.matchingPayments.length
              ? 'hidden'
              : 'visible',
        }}
      >
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
      </Badge.Ribbon>
      {modalVisible && (
        <AddPaymentModal
          closeModal={closeModal}
          paymentData={{
            ...(selectedPayment && selectedCompany == selectedPayment.company
              ? {
                  // ...relatedCompanies.find(
                  //   (company: IRealestate) => company._id === selectedCompany
                  // ),
                  invoiceNumber: selectedPayment.invoiceNumber,
                  type: selectedPayment.type,
                  invoiceCreationDate: selectedPayment.invoiceCreationDate,
                  domain: {
                    _id: selectedPayment.domain,
                  },
                  street: { _id: selectedPayment.street },
                  company: { _id: selectedPayment.company },
                  monthService: { _id: selectedPayment.monthService },
                  description: `${transaction.OSND} (taken from the transaction description)`,
                  invoice: selectedPayment.invoice,
                  provider: selectedPayment.provider,
                  reciever: selectedPayment.reciever,
                  generalSum: transactionAmount,
                }
              : {
                  ...relatedCompanies.find(
                    (company: IRealestate) => company._id === selectedCompany
                  ),
                  generalSum: transactionAmount,
                  description: `${transaction.OSND} (taken from the transaction description)`,
                  invoiceCreationDate: dayjs(transaction.DAT_OD, 'DD.MM.YYYY'),
                  company: selectedCompany,
                  domain: domain,
                }),
          }}
          paymentActions={
            selectedPayment && selectedCompany == selectedPayment.company
              ? { edit: false, preview: false, create: true }
              : { edit: false, preview: false }
          }
        />
      )}
    </>
  )
}

export default TransactionDrawer
