"use client"

import dynamic from 'next/dynamic'
import React, { useMemo } from 'react'

const Line = dynamic(
  () => import('@ant-design/plots').then(({ Line }) => Line),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Завантаження зведеного графіка...
      </div>
    ),
  }
)

export interface DomainPaymentData {
  time: string
  amount: number
  companyName: string
}

interface DomainPaymentsChartProps {
  data: DomainPaymentData[]
  isDarkMode?: boolean
  textColor?: string
}

export const DomainPaymentsChart: React.FC<DomainPaymentsChartProps> = ({
  data,
  isDarkMode = false,
  textColor = '#8c8c8c', 
}) => {
  const config = useMemo(() => {
    return {
      data,
      xField: 'time',
      yField: 'amount',
      colorField: 'companyName',
      seriesField: 'companyName',
      smooth: true,
      theme: isDarkMode ? 'dark' : 'light', 

      legend: {
        color: {
          position: 'left',
          layout: 'vertical',
          itemLabelFill: textColor, 
        },
        position: 'left',
        layout: 'vertical',
        itemName: {
          style: {
            fill: textColor, 
          },
        },
      },

      xAxis: {
        label: {
          style: {
            fill: textColor,
          },
        },
      },

      yAxis: {
        label: {
          style: {
            fill: textColor,
          },
        },
        grid: {
          line: {
            style: {
              stroke: textColor,
              strokeOpacity: 0.15,
            },
          },
        },
      },

      tooltip: {
        shared: true,
        showMarkers: true,
      },
      interactions: [
        { type: 'legend-filter' },
      ],
    }
  }, [data, isDarkMode, textColor])

  return <Line {...config} />
}