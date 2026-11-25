import { useGetInflationIndexesQuery } from '@common/api/inflationIndexApi/inflationIndex.api'
import type { IInflationIndex } from '@common/api/inflationIndexApi/inflationIndex.api.types'
import useTheme from '@modules/hooks/useTheme'
import type { IDebtPeriod } from '@utils/debt-calculation/company-debt'
import { buildMonthRange, formatPeriod } from '@utils/debt-calculation/months'
import { Alert, Empty, Spin, theme, Typography } from 'antd'
import dynamic from 'next/dynamic'
import { formatIndex } from './format'

const Line = dynamic(
  () => import('@ant-design/plots').then(({ Line }) => Line),
  { ssr: false }
)

const SERIES_NAME = 'Індекс інфляції, %'

// Checked for contrast against each theme's surface.
const COLORS = { light: '#257de0', dark: '#338ced' }

export interface IIndexChartRow {
  /** MM.YYYY */
  month: string
  /** `null` leaves a gap: the month is not published yet. */
  value: number | null
}

export const buildIndexRows = (
  indexes: IInflationIndex[],
  { from, to }: IDebtPeriod
): IIndexChartRow[] => {
  const byPeriod = new Map(
    indexes.map((item) => [formatPeriod(item), item.value])
  )

  return buildMonthRange(from, to).map((yearMonth) => ({
    month: `${String(yearMonth.month).padStart(2, '0')}.${yearMonth.year}`,
    value: byPeriod.get(formatPeriod(yearMonth)) ?? null,
  }))
}

interface Props {
  period: IDebtPeriod
}

/** The official index by month: national statistics, the same for everyone. */
const IndexChart: React.FC<Props> = ({ period }) => {
  const { token } = theme.useToken()
  const [appTheme] = useTheme()
  const isDark = appTheme === 'dark'
  const color = COLORS[isDark ? 'dark' : 'light']

  const { data, isFetching, isError } = useGetInflationIndexesQuery({
    from: formatPeriod(period.from),
    to: formatPeriod(period.to),
  })
  const rows = buildIndexRows(data ?? [], period)
  const axis = {
    title: false,
    labelFill: token.colorTextSecondary,
    labelOpacity: 1,
  }

  if (isError) {
    return (
      <Alert message="Не вдалося завантажити індекси" type="error" showIcon />
    )
  }

  return (
    <Spin spinning={isFetching}>
      {rows.every((row) => row.value === null) ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            isFetching ? 'Завантаження...' : 'Немає індексів за обраний період'
          }
        />
      ) : (
        <figure style={{ margin: 0 }}>
          <Typography.Text strong>{SERIES_NAME}</Typography.Text>
          <Line
            data={rows}
            xField="month"
            yField="value"
            height={280}
            theme={isDark ? 'dark' : 'light'}
            scale={{ y: { nice: true } }}
            style={{ stroke: color, lineWidth: 2 }}
            // Without points a month between two gaps would not be visible.
            point={{ sizeField: 4, style: { fill: color, stroke: color } }}
            axis={{
              x: { ...axis, tickStroke: token.colorSplit },
              y: {
                ...axis,
                gridStroke: token.colorSplit,
                labelFormatter: (value: number) =>
                  String(value).replace('.', ','),
              },
            }}
            tooltip={{
              title: 'month',
              items: [
                (row: IIndexChartRow) => ({
                  name: SERIES_NAME,
                  value: formatIndex(row.value),
                  color,
                }),
              ],
            }}
          />
        </figure>
      )}
    </Spin>
  )
}

export default IndexChart
