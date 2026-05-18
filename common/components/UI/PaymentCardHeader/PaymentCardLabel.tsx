import React from 'react'
import { Button, Space, Grid } from 'antd'
import PaymentCascader from '@components/UI/PaymentCascader'
import StreetsSelector from '@components/StreetsSelector'
import {
  CompanyFilterTags,
  DomainFilterTags,
} from '@components/UI/Reusable/FilterTags'
import { AppRoutes } from '@utils/constants'
import { useRouter } from 'next/router'
import { ColumnSelect } from '@components/UI/PaymentCardHeader'
import styles from './styles.module.scss'
import { SelectOutlined } from '@ant-design/icons'

const { useBreakpoint } = Grid

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
  allowedServices,
}: any) => {
  const router = useRouter()
  const { pathname } = router
  const screens = useBreakpoint()
  const isMobile = screens.xs

  return (
    <Space
      wrap
      size="small"
      direction={isMobile ? 'vertical' : 'horizontal'}
      className={styles.container}
    >
      <Button
        className={styles.paymentButton}
        type="link"
        onClick={() => {
          if (enablePaymentsButton) {
            router.push(AppRoutes.PAYMENT)
          }
        }}
      >
        {isAdmin ? 'Платежі' : 'Мої платежі'}
        <SelectOutlined />
      </Button>

      {pathname === AppRoutes.PAYMENT && (
        <Space
          size="middle"
          direction={isMobile ? 'vertical' : 'horizontal'}
          className={styles.section}
        >
          <div className={styles.selectors}>
            <ColumnSelect
              className={styles.select}
              onSelect={onColumnsSelect}
              allowedServices={allowedServices}
            />
            <PaymentCascader
              className={styles.select}
              onChange={setCurrentDateFilter}
            />
            <StreetsSelector
              className={styles.select}
              setFilters={setFilters}
              streets={streets}
              filters={filters}
            />
          </div>
          <Space
            direction="vertical"
            size={4}
            align="start"
            className={styles.tags}
          >
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
