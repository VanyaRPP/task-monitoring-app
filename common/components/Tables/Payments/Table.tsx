import React from 'react'
import { Table, Empty } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { AppRoutes, Roles, ServiceType } from '@utils/constants'
import { renderCurrency, toRoundFixed } from '@utils/helpers'
import { useRouter } from 'next/router'
import { IGetPaymentResponse } from '@common/api/paymentApi/payment.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'

export interface PaymentDeleteItem {
  id: string
  date: string
  domain: string
  company: string
}

interface Props {
  onSelect(a: any, selected: any, rows: any): void

  columns: ColumnsType<any>
  payments: IGetPaymentResponse
  selectedColumns: string[]
  setPageData: (data: { currentPage: number; pageSize: number }) => void
  setFilters: (filters: any) => void
  paymentsDeleteItems: PaymentDeleteItem[]
  setPaymentsDeleteItems: (items: any[]) => void
  setSelectedPayments: (payments: any[]) => void
  summaryColumns: any[]
  paymentsLoading: boolean
  paymentsFetching: boolean
}

const PaymentsTable: React.FC<Props> = ({
  onSelect,
  columns,
  payments,
  selectedColumns,
  setPageData,
  setFilters,
  paymentsDeleteItems,
  setPaymentsDeleteItems,
  setSelectedPayments,
  summaryColumns,
  paymentsLoading,
  paymentsFetching,
}) => {
  const router = useRouter()

  const {
    isFetching: currUserFetching,
    isLoading: currUserLoading,
    data: currUser,
  } = useGetCurrentUserQuery()

  return (
    <Table
      rowKey="_id"
      rowSelection={
        currUser?.roles?.includes(Roles.GLOBAL_ADMIN) &&
        router.pathname === AppRoutes.PAYMENT && {
          selectedRowKeys: paymentsDeleteItems.map((item) => item.id),
          preserveSelectedRowKeys: true,
          onChange: (_, selectedRows) => {
            setSelectedPayments(selectedRows)
            setPaymentsDeleteItems(
              selectedRows.map((item) => ({
                id: item._id,
                date: item.monthService?.date,
                domain: item.domain?.name,
                company: item.company?.companyName,
              }))
            )
          },
          onSelect: onSelect,
        }
      }
      columns={columns}
      dataSource={payments?.data}
      pagination={
        (router.pathname === AppRoutes.PAYMENT ||
          router.pathname === AppRoutes.SEP_DOMAIN) && {
          total: payments?.total,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          position: ['bottomCenter'],
          onChange: (currentPage, pageSize) => {
            setPageData({ currentPage, pageSize })
          },
        }
      }
      onChange={(_, filters) => {
        setFilters(filters)
      }}
      scroll={{
        x:
          (router.pathname === AppRoutes.PAYMENT
            ? 1300 + selectedColumns.length * 132
            : 1300) -
          (payments?.realEstatesFilter?.length <= 1 ? 200 : 0) -
          (payments?.domainsFilter?.length <= 1 ? 200 : 0),
      }}
      summary={() =>
        payments?.data?.length > 0 ? (
          <Table.Summary>
            <Table.Summary.Row>
              {summaryColumns.map(({ column, index }) =>
                column.dataIndex === 'debit' ? (
                  <Table.Summary.Cell key={index} index={index} align="center">
                    {renderCurrency(
                      toRoundFixed(payments?.totalPayments?.debit)
                    )}
                  </Table.Summary.Cell>
                ) : column.dataIndex === 'credit' ? (
                  <Table.Summary.Cell key={index} index={index} align="center">
                    {renderCurrency(
                      toRoundFixed(payments?.totalPayments?.credit)
                    )}
                  </Table.Summary.Cell>
                ) : (
                  <Table.Summary.Cell key={index} index={index}>
                    {Object.values(ServiceType).includes(column.dataIndex)
                      ? renderCurrency(
                          toRoundFixed(
                            payments?.totalPayments?.[column.dataIndex]
                          )
                        )
                      : null}
                  </Table.Summary.Cell>
                )
              )}
            </Table.Summary.Row>
            <Table.Summary.Row>
              {summaryColumns.map(({ column, index }) =>
                column.dataIndex !== 'credit' ? (
                  <Table.Summary.Cell
                    key={index}
                    index={index}
                    colSpan={column.dataIndex === 'debit' ? 2 : 1}
                    align="center"
                  >
                    {column.dataIndex === 'debit'
                      ? renderCurrency(
                          toRoundFixed(
                            Number(payments?.totalPayments?.debit || 0) -
                              Number(payments?.totalPayments?.credit || 0)
                          )
                        )
                      : null}
                  </Table.Summary.Cell>
                ) : null
              )}
            </Table.Summary.Row>
          </Table.Summary>
        ) : null
      }
      bordered
      locale={{ emptyText: <Empty description="No Data" /> }}
      loading={
        currUserLoading ||
        currUserFetching ||
        paymentsLoading ||
        paymentsFetching
      }
    />
  )
}

export default PaymentsTable
