import { Badge, Select, Space, Dropdown } from 'antd'
import React, { FC, useEffect, useMemo, useState } from 'react'
import { ITransaction } from './transactionTypes' 
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import AddPaymentModal from '@components/AddPaymentModal'
import dayjs from 'dayjs'
import { DownOutlined } from '@ant-design/icons'
import { matchCompany } from './bankHelper'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { Operations } from '@utils/constants'
import { useQuickPayment } from './useQuickPayment'

interface TransactionDrawerProps {
  transaction: ITransaction
  domain: IExtendedDomain
}

const TransactionDrawer: FC<TransactionDrawerProps> = ({ transaction, domain }) => {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  const { data: realEstatesData } = useGetAllRealEstateQuery({ domainId: domain._id })
  const relatedCompanies = useMemo(() => realEstatesData?.data || [], [realEstatesData])

  const {
    loading,
    isServicesLoading,
    selectedService,
    setSelectedService,
    transactionPayload,
    dropdownItems
  } = useQuickPayment({ transaction, domain, selectedCompany, relatedCompanies })

  useEffect(() => {
    if (!relatedCompanies.length) return
    const { companyId } = matchCompany(transaction, relatedCompanies)
    setSelectedCompany(companyId)
  }, [transaction, relatedCompanies])

  const closeModal = () => {
    setModalVisible(false)
    setSelectedService(null)
  }

  return (
    <>
      <Badge.Ribbon
        text="Платіж є"
        color="purple"
        style={{ top: '-50%', visibility: transaction.isMatchingPayment ? 'visible' : 'hidden' }}
      >
        <Space.Compact style={{ width: '100%' }}>
          <Select
            placeholder="Select a company"
            onChange={setSelectedCompany}
            value={selectedCompany ?? undefined}
            style={{ width: 'calc(100% - 120px)' }}
          >
            {relatedCompanies.map((c) => (
              <Select.Option key={c._id} value={c._id}>{c.companyName}</Select.Option>
            ))}
          </Select> 

          <Dropdown.Button
            type="primary"
            loading={loading || isServicesLoading}
            disabled={!selectedCompany}
            trigger={['hover']}
            menu={{ items: dropdownItems }}
            onClick={() => { setSelectedService(null); setModalVisible(true); }}
            icon={<DownOutlined />}
            style={{ width: '120px' }}
          >
            Send
          </Dropdown.Button> 
        </Space.Compact>
      </Badge.Ribbon>

      {modalVisible && (
        <AddPaymentModal
          key={selectedService?._id || 'manual'}
          closeModal={closeModal}
          paymentData={{
            ...relatedCompanies.find((c) => c._id === selectedCompany),
            generalSum: parseFloat(transaction.SUM as string),
            invoiceCreationDate: selectedService 
              ? dayjs(selectedService.date).toDate() 
              : dayjs(transaction.DAT_OD, 'DD.MM.YYYY').toDate(),
            monthService: selectedService, 
            company: selectedCompany,
            domain: domain,
            transaction: transactionPayload,
            type: Operations.Credit,
          }}
          paymentActions={{ edit: false, preview: false }}
        />
      )}
    </>
  )
}

export default TransactionDrawer