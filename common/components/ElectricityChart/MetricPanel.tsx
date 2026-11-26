import { formatAxisValue, formatValue } from '@utils/formatChartValue'
import { Empty, theme, Typography } from 'antd'
import dynamic from 'next/dynamic'
import type { IElectricityRow } from './electricityHistory'
import type { IMetric } from './metrics'
import s from './style.module.scss'

const Line = dynamic(
  () => import('@ant-design/plots').then(({ Line }) => Line),
  { ssr: false }
)

const PANEL_HEIGHT = 190
// The same for every panel, so that their months stay one under another.
const PLOT_PADDING_LEFT = 72
const PLOT_PADDING_RIGHT = 24

export interface ITooltipSeries extends IMetric {
  color: string
}

interface Props {
  rows: IElectricityRow[]
  metric: IMetric
  color: string
  /** Every metric on screen: the tooltip of any panel shows the whole month. */
  tooltipSeries: ITooltipSeries[]
  isDark: boolean
}

const MetricPanel: React.FC<Props> = ({
  rows,
  metric,
  color,
  tooltipSeries,
  isDark,
}) => {
  const { token } = theme.useToken()
  const hasData = rows.some((row) => row[metric.field] !== null)

  return (
    <section className={s.panel} aria-label={metric.name}>
      <Typography.Text strong>
        {metric.name}, {metric.unit}
      </Typography.Text>
      {hasData ? (
        <Line
          data={rows}
          xField="month"
          yField={metric.field}
          height={PANEL_HEIGHT}
          paddingLeft={PLOT_PADDING_LEFT}
          paddingRight={PLOT_PADDING_RIGHT}
          theme={isDark ? 'dark' : 'light'}
          scale={{ y: { nice: true } }}
          style={{ stroke: color, lineWidth: 2 }}
          // Without points a month between two gaps would not be visible.
          point={{ sizeField: 4, style: { fill: color, stroke: color } }}
          axis={{
            x: {
              title: false,
              labelFill: token.colorTextSecondary,
              labelOpacity: 1,
              tickStroke: token.colorSplit,
            },
            y: {
              title: false,
              labelFill: token.colorTextSecondary,
              labelOpacity: 1,
              gridStroke: token.colorSplit,
              labelFormatter: formatAxisValue,
            },
          }}
          tooltip={{
            title: 'month',
            items: tooltipSeries.map((series) => (row: IElectricityRow) => ({
              name: `${series.name}, ${series.unit}`,
              value: formatValue(row[series.field]),
              color: series.color,
            })),
          }}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Немає даних" />
      )}
    </section>
  )
}

export default MetricPanel
