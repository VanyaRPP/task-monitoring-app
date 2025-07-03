import React from 'react'
import { Button, Space } from 'antd'
import PaymentCascader from '@components/UI/PaymentCascader/index'
import StreetsSelector from '@components/StreetsSelector'
import {
  CompanyFilterTags,
  DomainFilterTags,
} from '@components/UI/Reusable/FilterTags'
import { AppRoutes } from '@utils/constants'
import { useRouter } from 'next/router'
import { ColumnSelect } from '@components/UI/PaymentCardHeader'

const PaymentCardLabel = ({
  enablePaymentsButton,
  onColumnsSelect,
  setCurrentDateFilter,
  setFilters,
  streets,
  filters,
  domainFilter,
  realEstatesFilter,
  isAdmin,
}: any) => {
  const router = useRouter()
  const { pathname } = router

  return (
    <Space wrap size="small">
      <Button
        style={{ marginBottom: '10px', marginTop: '10px' }}
        type="link"
        onClick={() => {
          if (enablePaymentsButton) {
            router.push(AppRoutes.PAYMENT)
          }
        }}
      >
        {isAdmin ? 'Платежі' : 'Мої оплати'}
      </Button>
      {pathname === AppRoutes.PAYMENT && (
        <Space size="middle">
          <Space size="middle">
            <ColumnSelect
              style={{ minWidth: 200 }}
              onSelect={onColumnsSelect}
            />
            <PaymentCascader onChange={setCurrentDateFilter} />
            <StreetsSelector setFilters={setFilters} streets={streets} />
          </Space>
          <Space direction="vertical" size="middle" align="center">
            <DomainFilterTags
              collection={domainFilter}
              filters={filters}
              setFilters={setFilters}
            />
            <CompanyFilterTags
              collection={realEstatesFilter}
              filters={filters}
              setFilters={setFilters}
            />
          </Space>
        </Space>
      )}
    </Space>
  )
}

export default PaymentCardLabel