import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import type { IDomainOption } from '@components/InflationOverridePanel'
import useTheme from '@modules/hooks/useTheme'
import {
  Alert,
  Collapse,
  ConfigProvider,
  DatePicker,
  Empty,
  Flex,
  Segmented,
  Select,
  Spin,
} from 'antd'
import ukUA from 'antd/lib/locale/uk_UA'
import cn from 'classnames'
import { useEffect, useMemo, useState } from 'react'
import {
  buildElectricityRows,
  filterByAddress,
  getAddressOptions,
  MonthPeriod,
} from './electricityHistory'
import MetricPanel from './MetricPanel'
import { getMetrics, METRIC_COLORS, MetricKey } from './metrics'
import s from './style.module.scss'

interface Props {
  domains: IDomainOption[]
  /** The domain and address picked in the table filters, if it is just one. */
  preferredDomainId?: string
  preferredStreetId?: string
}

const ElectricityHistory: React.FC<Props> = ({
  domains,
  preferredDomainId,
  preferredStreetId,
}) => {
  const [pickedDomainId, setPickedDomainId] = useState(preferredDomainId)
  const [pickedAddress, setPickedAddress] = useState(preferredStreetId)
  const [period, setPeriod] = useState<MonthPeriod | null>(null)
  const [withVat, setWithVat] = useState(true)
  const [hidden, setHidden] = useState<MetricKey[]>([])
  const [appTheme] = useTheme()
  const isDark = appTheme === 'dark'

  useEffect(() => {
    if (preferredDomainId) setPickedDomainId(preferredDomainId)
  }, [preferredDomainId])

  useEffect(() => {
    if (preferredStreetId) setPickedAddress(preferredStreetId)
  }, [preferredStreetId])

  // Both filters are mandatory, so a missing or stale pick falls back to the
  // first option.
  const domainId = domains.some(({ value }) => value === pickedDomainId)
    ? pickedDomainId
    : domains[0]?.value

  const { currentData, isFetching, isError } = useGetAllServicesQuery(
    { domainId, limit: 0 },
    { skip: !domainId }
  )

  // The API sorts by date, newest first: so do the addresses.
  const addresses = useMemo(
    () => getAddressOptions(currentData?.data ?? []),
    [currentData]
  )
  const address = addresses.some(({ value }) => value === pickedAddress)
    ? pickedAddress
    : addresses[0]?.value

  const rows = useMemo(
    () =>
      buildElectricityRows(
        filterByAddress(currentData?.data ?? [], address),
        period
      ),
    [currentData, address, period]
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
        <Flex wrap gap={8} align="center">
          <Select
            value={domainId}
            onChange={setPickedDomainId}
            options={domains.map(({ text, value }) => ({ label: text, value }))}
            aria-label="Домен"
            className={s.select}
            showSearch
            optionFilterProp="label"
          />
          <Select
            value={address}
            onChange={setPickedAddress}
            options={addresses}
            aria-label="Адреса"
            placeholder="Адреса"
            className={s.select}
            showSearch
            optionFilterProp="label"
          />
          <DatePicker.RangePicker
            picker="month"
            format="MM.YYYY"
            placeholder={['Від місяця', 'До місяця']}
            value={period}
            onChange={(dates) =>
              setPeriod(dates?.[0] && dates?.[1] ? [dates[0], dates[1]] : null)
            }
          />
          <Segmented
            className={s.vatSwitch}
            options={['З ПДВ', 'Без ПДВ']}
            value={withVat ? 'З ПДВ' : 'Без ПДВ'}
            onChange={(value) => setWithVat(value === 'З ПДВ')}
          />
        </Flex>

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
const ElectricityChart: React.FC<Props> = (props) => (
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
