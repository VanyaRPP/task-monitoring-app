import { generateColorsArray } from '@utils/helpers'
import Chart from 'chart.js/auto'
import React, { useEffect, useRef } from 'react'
import s from './style.module.scss'
import {Spin} from "antd";
type dataSources = {
  label: string
  value: number
}

const ChartComponent: React.FC<{
  dataSources: dataSources[]
  chartTitle: string
  chartElementTitle: string
}> = ({ dataSources, chartTitle, chartElementTitle }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null)
  const myChartRef = useRef<Chart<'pie', number[], string> | null>(null)

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
            label: chartElementTitle,
            data: dataSources?.map((i) => i.value),
            backgroundColor: generateColorsArray(dataSources?.length),
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

    const resizeObserver = new ResizeObserver(() => {
      if (myChartRef.current) {
        myChartRef.current.resize()
      }
    })

    resizeObserver.observe(chartRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [chartRef, dataSources, chartTitle, chartElementTitle])

  if (!dataSources){
    return <div className={s.loading}><Spin size={'large'}/></div>
  }

  return (
    <div className={s.chartContainer}>
      {dataSources?.every((item) => item.value === 0) ? (
        'Усі займані площі домену дорівнюють нулю'
      ) : (
        <canvas ref={chartRef} className={s.chart} />
      )}
    </div>
  )
}
export default ChartComponent
