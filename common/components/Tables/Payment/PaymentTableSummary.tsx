import { Table } from 'antd'
import { ColumnType } from 'antd/es/table'
import {
  IExtendedPayment,
  IGetPaymentResponse,
} from '@common/api/paymentApi/payment.api.types'
import { ServiceType } from '@utils/constants'
import { renderCurrency, toRoundFixed } from '@utils/helpers'

function getSummaryColumns(
  columns: ColumnType<IExtendedPayment>[] = [],
  index = 0
): Array<{ column: ColumnType<IExtendedPayment>; index: number }> {
  let count = index
  return columns.reduce(
    (
      cells: Array<{ column: ColumnType<IExtendedPayment>; index: number }>,
      column
    ) => {
      if ((column as any).children) {
        const nested = getSummaryColumns((column as any).children, count)
        count += (column as any).children.length
        return [...cells, ...nested]
      }
      return [
        ...cells,
        { column: column as ColumnType<IExtendedPayment>, index: count++ },
      ]
    },
    []
  )
}

interface Props {
  payments?: IGetPaymentResponse
  visibleColumns: ColumnType<IExtendedPayment>[]
  hasRowSelection: boolean
}

const PaymentTableSummary: React.FC<Props> = ({
  payments,
  visibleColumns,
  hasRowSelection,
}) => {
  if (!payments?.data?.length) return null

  const totalPayments = payments.totalPayments
  const flatColumns = getSummaryColumns(visibleColumns, 0)
  const offset = hasRowSelection ? 1 : 0

  return (
    <Table.Summary>
      <Table.Summary.Row>
        {hasRowSelection && <Table.Summary.Cell index={0} />}
        {flatColumns.map(({ column, index }) => {
          const idx = index + offset
          if (column.dataIndex === 'debit') {
            return (
              <Table.Summary.Cell key={idx} index={idx} align="center">
                {renderCurrency(toRoundFixed(totalPayments.debit || 0))}
              </Table.Summary.Cell>
            )
          }
          if (column.dataIndex === 'credit') {
            return (
              <Table.Summary.Cell key={idx} index={idx} align="center">
                {renderCurrency(toRoundFixed(totalPayments.credit || 0))}
              </Table.Summary.Cell>
            )
          }
          const cellValue =
            totalPayments[column.dataIndex as keyof typeof totalPayments]

          // ServiceType columns always render a total; other columns render one
          // only when the aggregation produced a matching key (e.g. the
          // `custom-name:<name>` keys from getServiceTotalsPipeline).
          if (
            Object.values(ServiceType).includes(
              column.dataIndex as ServiceType
            ) ||
            (column.dataIndex && cellValue !== undefined)
          ) {
            return (
              <Table.Summary.Cell key={idx} index={idx}>
                {renderCurrency(toRoundFixed(Number(cellValue) || 0))}
              </Table.Summary.Cell>
            )
          }
          return <Table.Summary.Cell key={idx} index={idx} />
        })}
      </Table.Summary.Row>
      <Table.Summary.Row>
        {hasRowSelection && <Table.Summary.Cell index={0} />}
        {flatColumns.map(({ column, index }) => {
          const idx = index + offset
          if (column.dataIndex === 'debit') {
            return (
              <Table.Summary.Cell
                key={idx}
                index={idx}
                colSpan={2}
                align="center"
              >
                {renderCurrency(
                  toRoundFixed(
                    Number(totalPayments.debit || 0) -
                      Number(totalPayments.credit || 0)
                  )
                )}
              </Table.Summary.Cell>
            )
          }
          if (column.dataIndex === 'credit') return null
          return <Table.Summary.Cell key={idx} index={idx} />
        })}
      </Table.Summary.Row>
    </Table.Summary>
  )
}

export default PaymentTableSummary
