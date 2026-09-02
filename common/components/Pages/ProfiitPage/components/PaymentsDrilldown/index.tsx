'use client'

import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import Modal from '@components/UI/ModalWindow'
import { AppRoutes, Operations } from '@utils/constants'
import { Alert, Empty, Space, Table, Typography } from 'antd'
import { ExportOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import { FC, useMemo } from 'react'
import {
  money,
  numericCell,
  type DrillTarget,
} from '../ProfitTable/tableConfig'
import { normalizeCurrency, getCurrencySymbol } from '@utils/helpers'

const { Text } = Typography

/** Enough to cover any realistic month; `total` tells us if it wasn't. */
const PAGE_LIMIT = 100

export interface PaymentsDrilldownProps {
  domainId?: string
  /** `YYYY-MM`; null keeps the modal closed. */
  month: string | null
  /**
   * Debit lists what was invoiced, credit what actually arrived, and
   * `outstanding` rolls both up per company to answer "who still owes".
   */
  target: DrillTarget
  /** The figure was per-currency, so the list behind it must be too. */
  currency: string
  onClose: VoidFunction
}

interface DebtorRow {
  companyId: string
  companyName: string
  invoiced: number
  paid: number
  remaining: number
}

const PaymentsDrilldown: FC<PaymentsDrilldownProps> = ({
  domainId,
  month,
  target,
  currency,
  onClose,
}) => {
  const { t } = useTranslation()
  const isDebtors = target === 'outstanding'
  const type = isDebtors ? undefined : (target as Operations)

  const period = useMemo(() => {
    if (!month) return null
    const d = dayjs(month)
    return d.isValid() ? { year: d.year(), month: d.month() + 1 } : null
  }, [month])

  const {
    data: { data: allPayments = [], total = 0 } = {},
    isFetching,
    isError,
  } = useGetAllPaymentsQuery(
    {
      limit: PAGE_LIMIT,
      type,
      domainIds: domainId ? [domainId] : undefined,
      year: period?.year,
      month: period?.month,
      // The ledger files a payment under the month it is FOR, so the list has
      // to be filtered the same way - `date` resolves to the month service,
      // with the same fallback for rows that have none.
      dateField: 'date',
    },
    { skip: !domainId || !period }
  )

  // The API has no currency filter, so narrow client-side to the currency
  // whose figure was clicked. `total` still counts every currency, which is
  // why the truncation notice below compares against what we actually kept.
  const payments = useMemo(
    () =>
      allPayments.filter(
        (p) => normalizeCurrency(p.currency) === normalizeCurrency(currency)
      ),
    [allPayments, currency]
  )

  // Who still owes for this month: every invoice minus every payment, per
  // company. Same rule the month figure uses, just sliced differently.
  const debtors: DebtorRow[] = useMemo(() => {
    if (!isDebtors) return []
    const byCompany = new Map<string, DebtorRow>()

    for (const payment of payments) {
      const company = payment.company as any
      const companyId = company?._id?.toString() ?? 'unknown'
      const row = byCompany.get(companyId) ?? {
        companyId,
        companyName:
          company?.companyName ||
          payment.reciever?.companyName ||
          t('profitPage:drilldown.unknownCompany'),
        invoiced: 0,
        paid: 0,
        remaining: 0,
      }
      if (payment.type === Operations.Debit) {
        row.invoiced += payment.generalSum || 0
      } else {
        row.paid += payment.generalSum || 0
      }
      byCompany.set(companyId, row)
    }

    return [...byCompany.values()]
      .map((row) => ({ ...row, remaining: row.invoiced - row.paid }))
      .filter((row) => Math.abs(row.remaining) >= 1)
      .sort((a, b) => b.remaining - a.remaining)
  }, [isDebtors, payments, t])

  const debtorColumns: ColumnsType<DebtorRow> = useMemo(
    () => [
      {
        title: t('profitPage:drilldown.company'),
        dataIndex: 'companyName',
        key: 'companyName',
        ellipsis: true,
      },
      {
        title: t('profitPage:drilldown.invoiced'),
        dataIndex: 'invoiced',
        key: 'invoiced',
        width: 140,
        align: 'right',
        render: (value: number) => (
          <span style={numericCell}>{money(value)}</span>
        ),
      },
      {
        title: t('profitPage:drilldown.paid'),
        dataIndex: 'paid',
        key: 'paid',
        width: 140,
        align: 'right',
        render: (value: number) => (
          <span style={numericCell}>{money(value)}</span>
        ),
      },
      {
        title: t('profitPage:drilldown.remaining'),
        dataIndex: 'remaining',
        key: 'remaining',
        width: 150,
        align: 'right',
        render: (value: number) => (
          <Text
            strong
            type={value > 0 ? 'danger' : 'success'}
            style={numericCell}
          >
            {money(value)}
          </Text>
        ),
      },
    ],
    [t]
  )

  const columns: ColumnsType<IExtendedPayment> = useMemo(
    () => [
      {
        title: t('profitPage:drilldown.invoiceNumber'),
        dataIndex: 'invoiceNumber',
        key: 'invoiceNumber',
        width: 110,
        render: (value: number) => <span style={numericCell}>№{value}</span>,
      },
      {
        title: t('profitPage:drilldown.company'),
        key: 'company',
        ellipsis: true,
        render: (_, record) => {
          const name =
            (record.company as any)?.companyName || record.reciever?.companyName
          return name || <Text type="secondary">—</Text>
        },
      },
      {
        title: t('profitPage:drilldown.date'),
        key: 'date',
        width: 130,
        render: (_, record) => {
          const raw =
            type === Operations.Credit
              ? (record as any).paidAt || record.invoiceCreationDate
              : record.invoiceCreationDate
          return (
            <span style={numericCell}>{dayjs(raw).format('DD.MM.YYYY')}</span>
          )
        },
      },
      {
        title: t('profitPage:drilldown.sum'),
        dataIndex: 'generalSum',
        key: 'generalSum',
        width: 150,
        align: 'right',
        render: (value: number) => (
          <span style={numericCell}>
            {getCurrencySymbol(currency)} {money(value)}
          </span>
        ),
      },
    ],
    [t, type, currency]
  )

  const shown = allPayments.length
  const isTruncated = total > shown

  return (
    <Modal
      title={t(
        isDebtors
          ? 'profitPage:drilldown.titleOutstanding'
          : type === Operations.Credit
            ? 'profitPage:drilldown.titleActual'
            : 'profitPage:drilldown.titleExpected',
        { period: month ? dayjs(month).format('MMMM YYYY') : '' }
      )}
      onOk={onClose}
      onCancel={onClose}
      changed={() => false}
      okButtonProps={{ style: { display: 'none' } }}
      cancelText={t('profitPage:modal.closeText')}
      width={800}
    >
      {isError ? (
        <Alert type="error" message={t('profitPage:drilldown.errorLoading')} />
      ) : (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {isTruncated && (
            <Alert
              type="info"
              showIcon
              message={t('profitPage:drilldown.truncated', { shown, total })}
            />
          )}
          {isDebtors ? (
            <Table
              size="small"
              loading={isFetching}
              columns={debtorColumns}
              dataSource={debtors}
              rowKey={(record) => record.companyId}
              pagination={false}
              scroll={{ y: 400 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t('profitPage:drilldown.allSettled')}
                  />
                ),
              }}
              summary={(rows: readonly DebtorRow[]) => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <Text strong>{t('profitPage:drilldown.total')}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      <Text strong style={numericCell}>
                        {money(rows.reduce((acc, r) => acc + r.remaining, 0))}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          ) : (
            <Table
              size="small"
              loading={isFetching}
              columns={columns}
              dataSource={payments}
              rowKey={(record) => record._id}
              pagination={false}
              scroll={{ y: 400 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t('profitPage:drilldown.empty')}
                  />
                ),
              }}
              summary={(rows: readonly IExtendedPayment[]) => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <Text strong>{t('profitPage:drilldown.total')}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      <Text strong style={numericCell}>
                        {money(
                          rows.reduce((acc, r) => acc + (r.generalSum || 0), 0)
                        )}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          )}
          <Link href={AppRoutes.PAYMENT}>
            {t('profitPage:drilldown.openPayments')} <ExportOutlined />
          </Link>
        </Space>
      )}
    </Modal>
  )
}

export default PaymentsDrilldown
