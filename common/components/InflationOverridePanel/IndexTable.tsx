import { useGetInflationIndexesQuery } from '@common/api/inflationIndexApi/inflationIndex.api'
import { Alert, Table, theme, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import { formatIndex } from './format'
import { buildYearRows, IYearRow } from './yearRows'

const MONTH_NAMES = [
  'Січ',
  'Лют',
  'Бер',
  'Кві',
  'Тра',
  'Чер',
  'Лип',
  'Сер',
  'Вер',
  'Жов',
  'Лис',
  'Гру',
]

/** The whole official directory: years down, months across. */
const IndexTable: React.FC = () => {
  const { token } = theme.useToken()
  const { data, isFetching, isError } = useGetInflationIndexesQuery(undefined)
  const rows = useMemo(() => buildYearRows(data ?? []), [data])

  if (isError) {
    return (
      <Alert message="Не вдалося завантажити індекси" type="error" showIcon />
    )
  }

  const shaded = () => ({ style: { background: token.colorFillQuaternary } })

  const columns: ColumnsType<IYearRow> = [
    {
      title: 'Рік',
      dataIndex: 'year',
      fixed: 'left',
      onCell: shaded,
      render: (year: number) => (
        <Typography.Text strong>{year}</Typography.Text>
      ),
    },
    ...MONTH_NAMES.map((name, i) => ({
      title: name,
      key: name,
      align: 'right' as const,
      render: (_: unknown, row: IYearRow) =>
        row.months[i] === null ? '' : formatIndex(row.months[i]),
    })),
    {
      title: 'За рік',
      key: 'total',
      align: 'right',
      onCell: shaded,
      // An unfinished year is only a year-to-date figure, hence muted.
      render: (_, row) => (
        <Typography.Text
          strong
          type={row.isComplete ? undefined : 'secondary'}
          title={row.isComplete ? undefined : 'За неповний рік'}
        >
          {formatIndex(row.total)}
        </Typography.Text>
      ),
    },
  ]

  return (
    <Table<IYearRow>
      size="small"
      pagination={false}
      rowKey="year"
      columns={columns}
      dataSource={rows}
      loading={isFetching}
      scroll={{ x: 'max-content' }}
      title={
        rows.length
          ? () => (
              <Typography.Title
                level={5}
                style={{ margin: 0, textAlign: 'center' }}
              >
                Зведена таблиця індексів споживчих цін з {rows[0].year} по{' '}
                {rows[rows.length - 1].year} рр. (%)
              </Typography.Title>
            )
          : undefined
      }
    />
  )
}

export default IndexTable
