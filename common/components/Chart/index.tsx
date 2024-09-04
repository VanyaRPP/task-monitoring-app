import { generateColorsArray } from '@utils/helpers'
import Chart from 'chart.js/auto'
import React, { useEffect, useRef } from 'react'
import s from './style.module.scss'
import { theme } from 'antd';
type dataSources = {
  label: string
  value: object
  color?: string
}

const ChartComponent: React.FC<{
  dataSources: dataSources[]
  chartTitle: string
  domainName: string
}> = ({ dataSources, chartTitle, domainName}) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null)
  const myChartRef = useRef<Chart<'pie', number[], string> | null>(null)
  const { token } = theme.useToken()

  useEffect(() => {
    if (!chartRef.current) return

    const ctx = chartRef.current.getContext('2d')
    myChartRef.current?.destroy()
    myChartRef.current = new Chart<'pie', number[], string>(ctx, {
      type: 'pie',
      data: {
        labels: dataSources?.map((i) => i.label),
        datasets: [
          {
            data: dataSources?.map((i) => i?.value?.part),
            backgroundColor: dataSources?.map(
              (item, index) =>
                item.color || generateColorsArray(dataSources?.length)[index]
            ),
            borderColor: token.colorBgContainer !== '#ffffff' ? '#141414' : '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: function(tooltipItem) {
                return `${domainName !== tooltipItem.label ? 'Частка площі' : 'Незаймані площі'} ${dataSources[tooltipItem.dataIndex]?.value?.area.toFixed(2)} м²`;
              },
              footer: function(tooltipItems) {
                return `${tooltipItems[0].parsed.toFixed(2)}%`
              },
            },
          },
        },
      },
    })

    const resizeObserver = new ResizeObserver(() => {
      if (myChartRef.current) {
        myChartRef.current.resize()
      }
    })

    resizeObserver.observe(chartRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [chartRef, dataSources, chartTitle, token])

  return (
    <div className={s.chartContainer}>
      {dataSources?.every((item) => item?.value?.part === 0) ? (
        'Усі займані площі домену дорівнюють нулю'
      ) : (
        <canvas ref={chartRef} className={s.chart} />
      )}
    </div>
  )
}
export default ChartComponent