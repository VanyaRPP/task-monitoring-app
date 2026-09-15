import { generateColorsArray } from '@utils/helpers'
import Chart from 'chart.js/auto'
import React, { useEffect, useRef, useState } from 'react'
import s from './style.module.scss'
import { theme, Empty, Button } from 'antd'

type dataSources = {
  label: string
  value: {
    part: number
    area: number
  }
  color?: string
}

const ChartComponent: React.FC<{
  dataSources: dataSources[]
  chartTitle: string
  domainName: string
}> = ({ dataSources = [], chartTitle, domainName }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null)
  const myChartRef = useRef<Chart<'pie', number[], string> | null>(null)
  const { token } = theme.useToken()

  // Стан для розгортання списку компаній
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  // Обробка кольорів для малювання круга та нашої легенди
  const colorsArray = generateColorsArray(dataSources?.length || 0)
  const processedData = dataSources?.map((item, index) => ({
    ...item,
    finalColor: item.color || colorsArray[index] || '#e0e0e0'
  }))

  const SHOW_LIMIT = 6
  const showExpandButton = processedData.length > SHOW_LIMIT

  useEffect(() => {
    if (!chartRef.current) return

    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return

    // Повністю знищуємо старий екземпляр перед створенням нового
    if (myChartRef.current) {
      myChartRef.current.destroy()
    }

    myChartRef.current = new Chart<'pie', number[], string>(ctx, {
      type: 'pie',
      data: {
        labels: dataSources?.map((i) => i.label),
        datasets: [
          {
            data: dataSources?.map((i) => i?.value?.part),
            backgroundColor: dataSources?.map((item, index) => item.color || colorsArray[index] || '#e0e0e0'),
            borderColor: token.colorBgContainer,
            borderWidth: 2,
          },
        ],
      },
      options: {
        // ВАЖЛИВО: вимикаємо автоматичне розтягування, щоб графік слухався наших точних розмірів canvas
        responsive: false,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false, // Ховаємо дефолтну легенду Chart.js
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
                // Беруться дані з масиву безпечно
                const firstItem = tooltipItems && tooltipItems.length > 0 ? tooltipItems[0] : null
                const value = firstItem ? firstItem.raw : null
                return `${typeof value === 'number' ? value.toFixed(2) : '0.00'}%`
              },
            },
          },
        },
      },
    })

    return () => {
      if (myChartRef.current) {
        myChartRef.current.destroy()
      }
    }
    // ОЧИЩЕНО: залишено тільки базовий масив даних, щоб уникнути блокування перемальовування canvas
  }, [dataSources])

  return (
    <div className={s.analyticsBody}>
      
      {/* ЛІВА ЧАСТИНА: Контейнер для кругової діаграми з фіксованими HTML-розмірами */}
      <div className={s.chartContainer}>
        {dataSources?.some((item) => item?.value?.area > 0) ? (
          <canvas 
            ref={chartRef} 
            className={s.chart} 
            width={140} // Жорстко фіксуємо внутрішній розмір малюнка Chart.js
            height={140} 
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: token.colorTextDescription }}>
                Усі площі дорівнюють нулю
              </span>
            }
          />
        )}
      </div>

      {/* ПРАВА ЧАСТИНА: Список компаній у 2–3 колонки */}
      {dataSources?.some((item) => item?.value?.area > 0) && (
        <div className={s.legendContainer}>
          <ul className={`${s.legendList} ${isExpanded ? s.isExpanded : ''}`}>
            {processedData.map((item, index) => (
              <li key={index} className={s.legendItem}>
                <span 
                  className={s.colorBadge} 
                  style={{ backgroundColor: item.finalColor }} 
                />
                <span className={s.companyName}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>

          {/* Кнопка розгортання списку */}
          {showExpandButton && (
            <Button
              type="link"
              className={s.toggleButton}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Згорнути список' : 'Показати всі компанії'}
            </Button>
          )}
        </div>
      )}

    </div>
  )
}

export default ChartComponent
