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
}

export const DomainPaymentsChart: React.FC<DomainPaymentsChartProps> = ({
  data,
}) => {
  const config = useMemo(() => {
    return {
      data,
      xField: 'time',
      yField: 'amount',
      colorField: 'companyName',
      seriesField: 'companyName',
      smooth: true,

      legend: {
        color: {
          position: 'left',
          layout: 'vertical',
        },
        position: 'left',
        layout: 'vertical',
      },

      tooltip: {
        shared: true,
        showMarkers: true,
      },
      interactions: [
        { type: 'legend-filter' },
      ],
    }
  }, [data])

  return <Line {...config} />
}