import { Badge, Button, Select, Space, Dropdown, message, type MenuProps } from 'antd'
import React, { FC, useEffect, useMemo, useState } from 'react'
import { ITransaction } from './transactionTypes'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import AddPaymentModal from '@components/AddPaymentModal'
import dayjs from 'dayjs'
import { SendOutlined, DownOutlined } from '@ant-design/icons'

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
  const [isAccountMatched, setIsAccountMatched] = useState(false)
  const [loading, setLoading] = useState(false)

  const transactionAmount = parseFloat(transaction.SUM as string)

  const { data: realEstatesData } = useGetAllRealEstateQuery({
    domainId: domain._id,
  })

  const relatedCompanies = useMemo(
    () => realEstatesData?.data || [],
    [realEstatesData]
  )

  useEffect(() => {
    setSelectedCompany(null)
    setIsAccountMatched(false)
    setLoading(false)
  }, [transaction.TECHNICAL_TRANSACTION_ID])

  useEffect(() => {
    if (relatedCompanies.length === 0) return

    const foundByAccount = relatedCompanies.find(
      (company: IRealestate) => company.account === transaction.AUT_CNTR_ACC
    )

    if (foundByAccount) {
      setSelectedCompany(foundByAccount._id)
      setIsAccountMatched(true)
      return
    }

    if (transaction.previousCompanyId) {
      setSelectedCompany(String(transaction.previousCompanyId))
      setIsAccountMatched(false)
    }
  }, [
    transaction.TECHNICAL_TRANSACTION_ID,
    transaction.AUT_CNTR_ACC,
    transaction.previousCompanyId,
    transaction.isMatchingPayment,
    relatedCompanies,
  ])

  const handleCompanyChange = (value: string) => {
    setSelectedCompany(value)
    setIsAccountMatched(false)
  }

  const saveAccountToCompany = async (companyId: string) => {
    if (!transaction.AUT_CNTR_ACC) return
    try {
      await fetch(`/api/realestate/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: transaction.AUT_CNTR_ACC }),
      })
    } catch (error) {
      console.error('Failed to save account to company:', error)
    }
  }

  const showModal = () => setModalVisible(true)

  const closeModal = async (success?: boolean) => {
    setModalVisible(false)
    if (success === true) {
      message.success('Рахунок успішно створено!')
      if (selectedCompany && !isAccountMatched) {
        await saveAccountToCompany(selectedCompany)
      }
    }
    setLoading(false)
  }

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'credit',
      label: 'Швидке створення',
      onClick: () => {
        setLoading(true)
        showModal()
      },
    },
    {
      key: 'standard',
      label: 'Ручне створення',
      onClick: showModal,
    },
  ]

  const transactionPayload = {
    AUT_CNTR_ACC: transaction.AUT_CNTR_ACC,
    AUT_CNTR_NAM: transaction.AUT_CNTR_NAM,
    AUT_CNTR_MFO: transaction.AUT_CNTR_MFO,
    Description: transaction.OSND,
    TECHNICAL_TRANSACTION_ID: transaction.TECHNICAL_TRANSACTION_ID,
  }

  return (
    <>
      <Badge.Ribbon
        text="Платіж є"
        color="purple"
        style={{
          top: '-50%',
          visibility: transaction.isMatchingPayment ? 'visible' : 'hidden',
        }}
      >
        <Space.Compact style={{ width: '100%' }}>
          <Select
            placeholder="Select a related company"
            onChange={handleCompanyChange}
            value={selectedCompany ?? undefined}
            style={{ width: 'calc(100% - 80px)' }}
          >
            {relatedCompanies.map((company: IRealestate) => (
              <Select.Option key={company._id} value={company._id}>
                {company.companyName}
              </Select.Option>
            ))}
          </Select>
          {isAccountMatched ? (
            <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
              <Button type="primary" loading={loading}>
                Send <DownOutlined />
              </Button>
            </Dropdown>
          ) : (
            <Button
              iconPosition="end"
              icon={<SendOutlined />}
              type="primary"
              onClick={showModal}
              disabled={!selectedCompany}
              loading={loading}
            >
              Send
            </Button>
          )}
        </Space.Compact>
      </Badge.Ribbon>
      {modalVisible && (
        <AddPaymentModal
          closeModal={closeModal}
          paymentData={{
            ...(selectedPayment && selectedCompany == selectedPayment.company
              ? {
                  type: selectedPayment.type,
                  invoiceCreationDate: selectedPayment.invoiceCreationDate,
                  domain: { _id: selectedPayment.domain },
                  street: { _id: selectedPayment.street },
                  company: { _id: selectedPayment.company },
                  monthService: { _id: selectedPayment.monthService },
                  description: `${transaction.OSND}`,
                  invoice: selectedPayment.invoice,
                  provider: selectedPayment.provider,
                  reciever: selectedPayment.reciever,
                  generalSum: transactionAmount,
                  transaction: transactionPayload,
                }
              : {
                  ...relatedCompanies.find(
                    (company: IRealestate) => company._id === selectedCompany
                  ),
                  generalSum: transactionAmount,
                  description: `${transaction.OSND}`,
                  invoiceCreationDate: dayjs(transaction.DAT_OD, 'DD.MM.YYYY'),
                  company: selectedCompany,
                  domain: domain,
                  transaction: transactionPayload,
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