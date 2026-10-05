import { generateColorsArray } from '@utils/helpers'
import Chart from 'chart.js/auto'
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import cn from 'classnames'
import s from './style.module.scss'
import { theme, Empty, Button } from 'antd'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import {
  getLegendColumnCount,
  getLegendLayout,
  getLegendWidth,
  isStackedLayout,
  splitIntoColumns,
} from './legendLayout'

type dataSources = {
  label: string
  value: {
    part: number
    area: number
  }
  color?: string
}

// useLayoutEffect warns during SSR, fall back to useEffect on the server.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

const ChartComponent: React.FC<{
  dataSources: dataSources[]
  chartTitle: string
  domainName: string
}> = ({ dataSources, chartTitle, domainName }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<HTMLCanvasElement | null>(null)
  const myChartRef = useRef<Chart<'pie', number[], string> | null>(null)
  const { token } = theme.useToken()

  const [containerWidth, setContainerWidth] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [hiddenIndexes, setHiddenIndexes] = useState<number[]>([])

  const hasData = dataSources?.some((item) => item?.value?.area > 0)

  // Colors are generated once per data set so the pie and the legend match.
  const colors = useMemo(() => {
    const generated = generateColorsArray(dataSources?.length || 0)
    return (dataSources || []).map(
      (item, index) => item.color || generated[index]
    )
  }, [dataSources])

  useIsomorphicLayoutEffect(() => {
    const node = containerRef.current
    if (!node) return

    setContainerWidth(node.clientWidth)

    if (typeof ResizeObserver === 'undefined') return

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width
      if (typeof width === 'number') setContainerWidth(width)
    })
    resizeObserver.observe(node)

    return () => resizeObserver.disconnect()
  }, [hasData])

  useEffect(() => {
    if (!chartRef.current) return

    // A freshly created chart shows every segment again.
    setHiddenIndexes([])

    const ctx = chartRef.current.getContext('2d')
    myChartRef.current?.destroy()
    myChartRef.current = new Chart<'pie', number[], string>(ctx, {
      type: 'pie',
      data: {
        labels: dataSources?.map((i) => i.label),
        datasets: [
          {
            data: dataSources?.map((i) => i?.value?.part),
            backgroundColor: colors,
            borderColor: token.colorBgContainer,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                return `${
                  domainName !== tooltipItem.label
                    ? 'Частка площі'
                    : 'Незайнята площа'
                } ${dataSources[tooltipItem.dataIndex]?.value?.area.toFixed(
                  2
                )} м²`
              },
              footer: function (tooltipItems) {
                return `${tooltipItems[0].parsed.toFixed(2)}%`
              },
            },
          },
        },
      },
    })

    return () => {
      myChartRef.current?.destroy()
      myChartRef.current = null
    }
  }, [chartRef, dataSources, colors, chartTitle, domainName, token, hasData])

  const legendItems = useMemo(
    () =>
      (dataSources || []).map((item, index) => ({
        index,
        label: item.label,
        color: colors[index],
      })),
    [dataSources, colors]
  )

  const stacked = isStackedLayout(containerWidth)
  const columnsCount = getLegendColumnCount(
    legendItems.length,
    getLegendWidth(containerWidth)
  )
  const { hasOverflow, visibleCount, hiddenCount } = getLegendLayout({
    itemsCount: legendItems.length,
    columns: columnsCount,
    expanded,
  })
  const legendColumns = splitIntoColumns(
    legendItems.slice(0, visibleCount),
    columnsCount
  )

  const toggleSegment = (index: number) => {
    const chart = myChartRef.current
    if (chart) {
      chart.toggleDataVisibility(index)
      chart.update()
    }
    setHiddenIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const highlightSegment = (index: number | null) => {
    const chart = myChartRef.current
    if (!chart) return

    const active = index === null ? [] : [{ datasetIndex: 0, index }]
    chart.setActiveElements(active)
    chart.tooltip?.setActiveElements(active, { x: 0, y: 0 })
    chart.update()
  }

  if (!hasData) {
    return (
      <div className={s.emptyContainer}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: token.colorTextDescription }}>
              Усі площі дорівнюють нулю
            </span>
          }
        />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      data-testid="chart-layout"
      className={cn(s.chartLayout, { [s.stacked]: stacked })}
    >
      <div className={s.chartContainer}>
        <canvas ref={chartRef} className={s.chart} />
      </div>

      <div className={s.legend} data-testid="chart-legend">
        <div
          className={s.legendColumns}
          style={{
            gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))`,
          }}
        >
          {legendColumns.map((column, columnIndex) => (
            <ul
              key={columnIndex}
              className={s.legendColumn}
              data-testid="chart-legend-column"
            >
              {column.map((item) => {
                const isHidden = hiddenIndexes.includes(item.index)
                return (
                  <li key={item.index}>
                    <button
                      type="button"
                      data-testid="chart-legend-item"
                      className={cn(s.legendItem, {
                        [s.legendItemHidden]: isHidden,
                      })}
                      title={item.label}
                      aria-pressed={!isHidden}
                      onClick={() => toggleSegment(item.index)}
                      onMouseEnter={() => highlightSegment(item.index)}
                      onMouseLeave={() => highlightSegment(null)}
                      onFocus={() => highlightSegment(item.index)}
                      onBlur={() => highlightSegment(null)}
                    >
                      <span
                        className={s.legendSwatch}
                        style={{ backgroundColor: item.color }}
                      />
                      <span
                        className={s.legendLabel}
                        style={{ color: token.colorText }}
                      >
                        {item.label}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ))}
        </div>

        {hasOverflow && (
          <Button
            type="link"
            size="small"
            className={s.legendToggle}
            data-testid="chart-legend-toggle"
            aria-expanded={expanded}
            icon={expanded ? <UpOutlined /> : <DownOutlined />}
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded
              ? 'Згорнути список'
              : `Показати всі компанії (ще ${hiddenCount})`}
          </Button>
        )}
      </div>
    </div>
  )
}
export default ChartComponent
