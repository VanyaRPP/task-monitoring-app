import type { LineConfig } from '@ant-design/plots'
import useTheme from '@modules/hooks/useTheme'
import { useMemo } from 'react'

export const usePaymentsChartConfig = () => {
  const [theme] = useTheme()

  return useMemo<LineConfig>(() => {
    const config: LineConfig = {
      xField: 'date',
      yField: 'value',
      xAxis: {
        type: 'time',
      },
      seriesField: 'category',
      colorField: 'category',
      theme: theme === 'dark' ? 'dark' : 'light',
    }

    return config
  }, [theme])
}
