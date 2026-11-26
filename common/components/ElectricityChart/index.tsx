import useServiceHistory, {
  IServiceHistoryOptions,
} from '@modules/hooks/useServiceHistory'
import useTheme from '@modules/hooks/useTheme'
import ServiceHistoryFilters from '@components/UI/ServiceHistoryFilters'
import {
  Alert,
  Collapse,
  ConfigProvider,
  Empty,
  Flex,
  Segmented,
  Spin,
} from 'antd'
import ukUA from 'antd/lib/locale/uk_UA'
import cn from 'classnames'
import { useMemo, useState } from 'react'
import { buildElectricityRows } from './electricityHistory'
import MetricPanel from './MetricPanel'
import { getMetrics, METRIC_COLORS, MetricKey } from './metrics'
import s from './style.module.scss'

const ElectricityHistory: React.FC<IServiceHistoryOptions> = (props) => {
  const history = useServiceHistory(props)
  const { services, period, isFetching, isError } = history
  const [withVat, setWithVat] = useState(true)
  const [hidden, setHidden] = useState<MetricKey[]>([])
  const [appTheme] = useTheme()
  const isDark = appTheme === 'dark'

  const rows = useMemo(
    () => buildElectricityRows(services, period),
    [services, period]
  )

  const colors = METRIC_COLORS[isDark ? 'dark' : 'light']
  const metrics = getMetrics(withVat).map((metric) => ({
    ...metric,
    color: colors[metric.key],
  }))
  const visibleMetrics = metrics.filter(({ key }) => !hidden.includes(key))

  const toggleMetric = (key: MetricKey) =>
    setHidden((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )

  return (
    <ConfigProvider locale={ukUA}>
      <Flex vertical gap={16}>
        <ServiceHistoryFilters domains={props.domains} history={history}>
          <Segmented
            className={s.vatSwitch}
            options={['З ПДВ', 'Без ПДВ']}
            value={withVat ? 'З ПДВ' : 'Без ПДВ'}
            onChange={(value) => setWithVat(value === 'З ПДВ')}
          />
        </ServiceHistoryFilters>

        {isError ? (
          <Alert message="Помилка завантаження даних" type="error" showIcon />
        ) : (
          <Spin spinning={isFetching}>
            {!rows.length ? (
              <Empty
                description={
                  isFetching
                    ? 'Завантаження...'
                    : 'Немає даних за обраний період'
                }
              />
            ) : (
              <Flex vertical gap={16}>
                <ul className={s.legend} aria-label="Показники">
                  {metrics.map((metric) => {
                    const isHidden = hidden.includes(metric.key)

                    return (
                      <li key={metric.key}>
                        <button
                          type="button"
                          className={cn(s.legendItem, {
                            [s.legendItemHidden]: isHidden,
                          })}
                          aria-pressed={!isHidden}
                          onClick={() => toggleMetric(metric.key)}
                        >
                          <span
                            className={s.legendSwatch}
                            style={{ backgroundColor: metric.color }}
                          />
                          <span className={s.legendLabel}>{metric.name}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {!visibleMetrics.length && (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Усі показники приховані"
                  />
                )}
                {visibleMetrics.map((metric) => (
                  <MetricPanel
                    key={metric.key}
                    rows={rows}
                    metric={metric}
                    color={metric.color}
                    tooltipSeries={visibleMetrics}
                    isDark={isDark}
                  />
                ))}
              </Flex>
            )}
          </Spin>
        )}
      </Flex>
    </ConfigProvider>
  )
}

/**
 * Month-by-month history of the electricity figures of one domain address.
 * Collapsed by default, so nothing is loaded until it is opened.
 */
const ElectricityChart: React.FC<IServiceHistoryOptions> = (props) => (
  <Collapse
    size="small"
    style={{ marginTop: 16 }}
    items={[
      {
        key: 'electricity',
        label: 'Електропостачання',
        children: <ElectricityHistory {...props} />,
      },
    ]}
  />
)

export default ElectricityChart
