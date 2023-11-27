import React, { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import { calculatePercentage, generateColorsArray } from '@utils/helpers'
import s from './style.module.scss'

const ChartComponent: React.FC<{
  names: string[]
  values: number[]
  chartTitle: string
  chartElementTitle: string
}> = ({ names, values, chartTitle, chartElementTitle }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null)
  const myChartRef = useRef<Chart<'doughnut', number[], string> | null>(null)

  const createChart = () => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d')
      myChartRef.current?.destroy()
      myChartRef.current = new Chart<'doughnut', number[], string>(ctx, {
        type: 'doughnut',
        data: {
          labels: names,
          datasets: [
            {
              label: chartElementTitle,
              data: calculatePercentage(values),
              backgroundColor: generateColorsArray(values.length),
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
            title: {
              display: true,
              text: chartTitle,
              font: {
                size: 24,
                family: "'Arial', sans-serif",
                weight: 'bold',
              },
              color: '#722ed1',
            },
          },
        },
      })
    }
  }

  useEffect(() => {
    createChart()
    const resizeObserver = new ResizeObserver(() => {
      if (myChartRef.current) {
        myChartRef.current.resize()
      }
    })

    resizeObserver.observe(chartRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [names, values])

  return (
    <div className={s.chartContainer}>
      <canvas ref={chartRef} className={s.chart} />
    </div>
  )
}
export default ChartComponent
