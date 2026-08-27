'use client'

import React, { useMemo, useState, useEffect } from 'react'
import {
  Card,
  Col,
  Row,
  Select,
  Space,
  Statistic,
  Tooltip,
  Typography,
  theme,
} from 'antd'
import { Column, Pie } from '@ant-design/plots'
import { useTranslation } from 'next-i18next'
import dayjs, { Dayjs } from 'dayjs'
import type { ProfitMonthRow } from '@common/api/profitsApi/profits.type'
import useTheme from '@modules/hooks/useTheme'
import { Currency, CURRENCY_SELECT_OPTIONS } from '@utils/constants'
import {
  getCurrencySymbol,
  getCurrencyShortLabel,
  normalizeCurrency,
} from '@utils/helpers'
import { money } from '../ProfitTable/tableConfig'
import 'dayjs/locale/uk'

dayjs.locale('uk')

const { Text } = Typography
const { useToken } = theme

interface ProfitDashboardProps {
  dataSource: ProfitMonthRow[]
}

type PeriodTotals = ReturnType<typeof sumPeriod>

/**
 * Axis labels get one line and a lot of ticks, so full precision would not
 * fit: 150000 reads as "₴ 150 тис".
 */
const compactMoney = (value: number, currency: string) => {
  const symbol = getCurrencySymbol(currency)
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${symbol} ${(value / 1_000_000).toFixed(1)} млн`
  if (abs >= 1_000) return `${symbol} ${Math.round(value / 1_000)} тис`
  return `${symbol} ${value}`
}

const periodKeyOf = (d: Dayjs, periodType: string) => {
  if (periodType === 'Month') return d.format('YYYY-MM')
  if (periodType === 'Quarter')
    return `${d.year()}-Q${Math.ceil((d.month() + 1) / 3)}`
  return `${d.year()}`
}

// Scoped to one currency: adding UAH to USD would produce a number that means
// nothing. The picker above the cards chooses which one is on screen.
const sumPeriod = (rows: ProfitMonthRow[], currency: string) => {
  let expected = 0
  let actual = 0
  let expenses = 0

  rows.forEach((item) => {
    const totals = item.byCurrency?.[currency]
    if (!totals) return
    expected += totals.expected || 0
    actual += totals.actual || 0
    expenses += totals.expenses || 0
  })

  return {
    expected,
    actual,
    expenses,
    net: actual - expenses,
    // How much of what we invoiced actually came in.
    collectionRate: expected ? (actual / expected) * 100 : 0,
    outstanding: expected - actual,
  }
}

/**
 * Percentage change against the same figure one period back. `higherIsBetter`
 * flips the colour for expenses, where growth is not good news.
 */
const PeriodDelta: React.FC<{
  current: number
  previous?: number
  higherIsBetter?: boolean
}> = ({ current, previous, higherIsBetter = true }) => {
  const { t } = useTranslation()
  if (previous == null) return null

  // Going from nothing to something has no meaningful percentage.
  if (!previous) {
    return current ? (
      <Text type="secondary" style={{ fontSize: 12 }}>
        {t('profitPage:dashboard.noPrevious')}
      </Text>
    ) : null
  }

  const change = ((current - previous) / Math.abs(previous)) * 100
  if (Math.abs(change) < 0.1) {
    return (
      <Text type="secondary" style={{ fontSize: 12 }}>
        {t('profitPage:dashboard.unchanged')}
      </Text>
    )
  }

  const isGood = change > 0 === higherIsBetter
  return (
    <Text type={isGood ? 'success' : 'danger'} style={{ fontSize: 12 }}>
      {change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%{' '}
      {t('profitPage:dashboard.vsPrevious')}
    </Text>
  )
}

const ProfitDashboard: React.FC<ProfitDashboardProps> = ({ dataSource }) => {
  const { t } = useTranslation()
  const [periodType, setPeriodType] = useState('Quarter')
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)

  const { token } = useToken()

  // The app already tracks the active theme; guessing it by string-matching
  // token colours broke as soon as a token value changed.
  const [appTheme] = useTheme()
  const isDarkMode = appTheme === 'dark'

  const periodOptions = useMemo(() => {
    const options = new Set<string>()
    const sortedData = [...dataSource].sort(
      (a, b) => dayjs(b.month).unix() - dayjs(a.month).unix()
    )

    sortedData.forEach((item) => {
      const d = dayjs(item.month)
      if (!d.isValid()) return

      if (periodType === 'Month') {
        const monthStr = d.format('MMMM YYYY')
        options.add(monthStr.charAt(0).toUpperCase() + monthStr.slice(1))
      } else if (periodType === 'Quarter') {
        const q = Math.ceil((d.month() + 1) / 3)
        options.add(`Q${q} ${d.year()}`)
      } else if (periodType === 'Year') {
        options.add(d.format('YYYY'))
      }
    })

    return Array.from(options).map((opt) => ({ value: opt, label: opt }))
  }, [dataSource, periodType])

  useEffect(() => {
    if (periodOptions.length > 0) {
      setSelectedPeriod(periodOptions[0].value)
    } else {
      setSelectedPeriod(null)
    }
  }, [periodOptions])

  const filteredData = useMemo(() => {
    if (!selectedPeriod) return []

    return dataSource.filter((item) => {
      const d = dayjs(item.month)
      if (!d.isValid()) return false

      if (periodType === 'Month') {
        const monthStr = d.format('MMMM YYYY')
        return (
          monthStr.charAt(0).toUpperCase() + monthStr.slice(1) ===
          selectedPeriod
        )
      } else if (periodType === 'Quarter') {
        const q = Math.ceil((d.month() + 1) / 3)
        return `Q${q} ${d.year()}` === selectedPeriod
      } else if (periodType === 'Year') {
        return d.format('YYYY') === selectedPeriod
      }
      return false
    })
  }, [dataSource, periodType, selectedPeriod])

  // Currencies present anywhere on the page, busiest first.
  const availableCurrencies = useMemo(() => {
    const volume: Record<string, number> = {}
    dataSource.forEach((row) => {
      row.currencies?.forEach((c) => {
        const t = row.byCurrency[c]
        volume[c] =
          (volume[c] ?? 0) +
          Math.abs(t.expected) +
          Math.abs(t.actual) +
          Math.abs(t.expenses)
      })
    })
    return Object.keys(volume).sort((a, b) => volume[b] - volume[a])
  }, [dataSource])

  const [currency, setCurrency] = useState<string>(Currency.UAH)

  useEffect(() => {
    if (availableCurrencies.length && !availableCurrencies.includes(currency)) {
      setCurrency(availableCurrencies[0])
    }
  }, [availableCurrencies, currency])

  const aggregatedData = useMemo(
    () => sumPeriod(filteredData, currency),
    [filteredData, currency]
  )

  // Same period, one step back. Without it every figure on this page is a
  // number with nothing to compare against - the old cards faked that with an
  // invented "forecast"; this is the honest version.
  const previousData = useMemo(() => {
    if (!filteredData.length) return null

    const ref = dayjs(filteredData[0].month)
    const prevRef =
      periodType === 'Month'
        ? ref.subtract(1, 'month')
        : periodType === 'Quarter'
          ? ref.subtract(3, 'month')
          : ref.subtract(1, 'year')

    const prevKey = periodKeyOf(prevRef, periodType)
    const rows = dataSource.filter(
      (item) =>
        dayjs(item.month).isValid() &&
        periodKeyOf(dayjs(item.month), periodType) === prevKey
    )

    // The previous period may simply be off the current page. Showing nothing
    // beats showing a delta against a period we only partly loaded.
    return rows.length ? sumPeriod(rows, currency) : null
  }, [dataSource, filteredData, periodType, currency])

  const columnData = useMemo(() => {
    const data: any[] = []
    const chartData = [...filteredData].sort(
      (a, b) => dayjs(a.month).unix() - dayjs(b.month).unix()
    )

    chartData.forEach((item) => {
      const d = dayjs(item.month)
      const monthName = d.isValid() ? d.format('MMM') : item.month
      const totals = item.byCurrency?.[currency]

      data.push({
        period: monthName,
        type: t('profitPage:dashboard.expected'),
        value: totals?.expected || 0,
      })
      data.push({
        period: monthName,
        type: t('profitPage:dashboard.actual'),
        value: totals?.actual || 0,
      })
      data.push({
        period: monthName,
        type: t('profitPage:dashboard.expenses'),
        value: totals?.expenses || 0,
      })
    })
    return data
  }, [filteredData, t, currency])

  // Expense breakdown, driven by the `categories` field the add-cost form
  // already writes - no guessing the category from the description text.
  const pieData = useMemo(() => {
    const categoriesMap: Record<string, number> = {}

    filteredData.forEach((month) => {
      month.transactions?.forEach((tr) => {
        if (tr.type !== 'debit') return
        // Each expense carries its own currency; without this filter 100 USD
        // and 100 UAH would both add 100 to the same slice, and the pie would
        // silently disagree with the (currency-scoped) expenses card.
        if (normalizeCurrency(tr.currency) !== normalizeCurrency(currency)) {
          return
        }
        const cats = tr.categories?.length
          ? tr.categories
          : [t('profitPage:dashboard.uncategorized')]
        // Split evenly when a record carries several categories, so the pie
        // still sums to the month's expenses.
        const share = tr.amount / cats.length
        cats.forEach((cat) => {
          categoriesMap[cat] = (categoriesMap[cat] || 0) + share
        })
      })
    })

    return Object.entries(categoriesMap).map(([type, value]) => ({
      type,
      value,
    }))
  }, [filteredData, t, currency])

  const columnConfig = {
    data: columnData,
    xField: 'period',
    yField: 'value',
    colorField: 'type',
    // G2 v5 groups bars via the dodgeX transform; the v1 `isGroup` flag is
    // ignored, which would stack these three unrelated series into one bar.
    transform: [{ type: 'dodgeX' }],
    scale: {
      color: {
        range: [token.colorInfo, token.colorSuccess, token.colorWarning],
      },
    },
    theme: isDarkMode ? 'dark' : 'light',
    axis: {
      x: {
        labelFill: token.colorTextSecondary,
        tickStroke: token.colorSplit,
      },
      y: {
        labelFill: token.colorTextSecondary,
        gridStroke: token.colorSplit,
        // Bare numbers stopped being self-explanatory the moment a domain
        // could bill in more than one currency.
        labelFormatter: (value: number) => compactMoney(value, currency),
      },
    },
    tooltip: {
      items: [
        {
          channel: 'y',
          valueFormatter: (value: number) =>
            `${getCurrencySymbol(currency)} ${money(value)}`,
        },
      ],
    },
    legend: {
      color: { position: 'bottom', itemLabelFill: token.colorText },
    },
  }

  const pieConfig = {
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    radius: 1,
    innerRadius: 0.6,
    theme: isDarkMode ? 'dark' : 'light',
    label: {
      text: 'type',
      position: 'outside',
      style: { fill: token.colorText, textAlign: 'center' },
    },
    tooltip: {
      items: [
        {
          channel: 'y',
          valueFormatter: (value: number) =>
            `${getCurrencySymbol(currency)} ${money(value)}`,
        },
      ],
    },
    legend: {
      color: { position: 'left', itemLabelFill: token.colorText },
    },
  }

  const currencySuffix =
    availableCurrencies.length > 1 ? `, ${getCurrencyShortLabel(currency)}` : ''

  return (
    <div
      style={{
        marginBottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <Space>
        <Select
          value={periodType}
          onChange={setPeriodType}
          options={[
            { value: 'Month', label: t('profitPage:dashboard.periodMonth') },
            {
              value: 'Quarter',
              label: t('profitPage:dashboard.periodQuarter'),
            },
            { value: 'Year', label: t('profitPage:dashboard.periodYear') },
          ]}
          style={{ width: 120 }}
        />
        <Select
          value={selectedPeriod}
          onChange={setSelectedPeriod}
          options={periodOptions}
          style={{ width: 150 }}
          disabled={periodOptions.length === 0}
        />
        {/* Pointless when the domain only ever bills in one currency. */}
        {availableCurrencies.length > 1 && (
          <Select
            value={currency}
            onChange={setCurrency}
            options={CURRENCY_SELECT_OPTIONS.filter((o) =>
              availableCurrencies.includes(o.value)
            )}
            style={{ width: 130 }}
          />
        )}
      </Space>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">{t('profitPage:dashboard.expected')}</Text>
            <Statistic
              value={aggregatedData.expected}
              precision={2}
              suffix={getCurrencyShortLabel(currency)}
            />
            <PeriodDelta
              current={aggregatedData.expected}
              previous={previousData?.expected}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">{t('profitPage:dashboard.actual')}</Text>
            <Statistic
              value={aggregatedData.actual}
              precision={2}
              suffix={getCurrencyShortLabel(currency)}
              valueStyle={{
                color:
                  aggregatedData.outstanding <= 0
                    ? token.colorSuccess
                    : token.colorError,
              }}
            />
            <Space direction="vertical" size={0}>
              <Tooltip title={t('profitPage:dashboard.collectedHint')}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {aggregatedData.collectionRate.toFixed(1)}%{' '}
                  {t('profitPage:dashboard.collected')}
                </Text>
              </Tooltip>
              <PeriodDelta
                current={aggregatedData.actual}
                previous={previousData?.actual}
              />
            </Space>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">{t('profitPage:dashboard.expenses')}</Text>
            <Statistic
              value={aggregatedData.expenses}
              precision={2}
              suffix={getCurrencyShortLabel(currency)}
            />
            <PeriodDelta
              current={aggregatedData.expenses}
              previous={previousData?.expenses}
              higherIsBetter={false}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">{t('profitPage:dashboard.net')}</Text>
            <Statistic
              value={aggregatedData.net}
              precision={2}
              suffix={getCurrencyShortLabel(currency)}
              valueStyle={{
                color:
                  aggregatedData.net >= 0
                    ? token.colorSuccess
                    : token.colorError,
              }}
            />
            <PeriodDelta
              current={aggregatedData.net}
              previous={previousData?.net}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={14}>
          <Card
            title={`${t('profitPage:dashboard.trendTitle')}${currencySuffix}`}
            size="small"
            style={{ height: '100%' }}
          >
            <div style={{ height: 280 }}>
              {columnData.length > 0 ? (
                <Column {...columnConfig} />
              ) : (
                <Text type="secondary">
                  {t('profitPage:dashboard.notEnoughData')}
                </Text>
              )}
            </div>
          </Card>
        </Col>
        <Col span={10}>
          <Card
            title={`${t('profitPage:dashboard.structureTitle')}${currencySuffix}`}
            size="small"
            style={{ height: '100%' }}
          >
            <div style={{ height: 280, display: 'flex', alignItems: 'center' }}>
              {pieData.length > 0 ? (
                <Pie {...pieConfig} />
              ) : (
                <Text type="secondary">
                  {t('profitPage:dashboard.notEnoughData')}
                </Text>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ProfitDashboard
