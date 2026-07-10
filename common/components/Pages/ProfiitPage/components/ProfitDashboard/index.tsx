'use client'

import React, { useMemo, useState, useEffect } from 'react'
import {
  Card,
  Col,
  Row,
  Select,
  Space,
  Statistic,
  Typography,
  theme,
} from 'antd'
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import { Column, Pie } from '@ant-design/plots'
import { useTranslation } from 'next-i18next'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'

dayjs.locale('uk')

const { Text } = Typography
const { useToken } = theme

interface ProfitDashboardProps {
  dataSource: any[]
}

const ProfitDashboard: React.FC<ProfitDashboardProps> = ({ dataSource }) => {
  const { t } = useTranslation()
  const [periodType, setPeriodType] = useState('Quarter')
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)

  const { token } = useToken()

  const isDarkMode =
    token.colorBgBase === '#000' ||
    token.colorBgLayout === '#141414' ||
    String(token.colorText).includes('255')

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

  const aggregatedData = useMemo(() => {
    let actualProfit = 0
    let actualExpense = 0

    filteredData.forEach((item) => {
      actualProfit += item.credit || 0
      actualExpense += item.debit || 0
    })

    const plannedProfit = actualProfit > 0 ? actualProfit * 1.05 : 39064.52
    const plannedExpense = actualExpense > 0 ? actualExpense * 1.1 : 91149.45

    const profitDiff = plannedProfit
      ? ((actualProfit - plannedProfit) / plannedProfit) * 100
      : 0
    const expenseDiff = plannedExpense
      ? ((actualExpense - plannedExpense) / plannedExpense) * 100
      : 0

    return {
      actualProfit,
      actualExpense,
      plannedProfit,
      plannedExpense,
      profitDiff,
      expenseDiff,
    }
  }, [filteredData])

  const columnData = useMemo(() => {
    const data: any[] = []
    const chartData = [...filteredData].sort(
      (a, b) => dayjs(a.month).unix() - dayjs(b.month).unix()
    )

    chartData.forEach((item) => {
      const d = dayjs(item.month)
      const monthName = d.isValid() ? d.format('MMM') : item.month
      const actProfit = item.credit || 0
      const actExpense = item.debit || 0

      data.push({
        period: monthName,
        type: t('profitPage:dashboard.plannedProfit'),
        value: actProfit * 1.05,
      })
      data.push({
        period: monthName,
        type: t('profitPage:dashboard.actualProfit'),
        value: actProfit,
      })
      data.push({
        period: monthName,
        type: t('profitPage:dashboard.plannedExpense'),
        value: actExpense * 0.95,
      })
      data.push({
        period: monthName,
        type: t('profitPage:dashboard.actualExpense'),
        value: actExpense,
      })
    })
    return data
  }, [filteredData, t])

  const pieData = useMemo(() => {
    const categoriesMap: Record<string, number> = {}

    filteredData.forEach((month) => {
      month.transactions?.forEach((tr: any) => {
        if (tr.type === 'credit') {
          let cat = tr.categories?.[0]

          if (!cat) {
            const desc = (tr.description || '').toLowerCase()
            if (desc.includes('коворкінг')) cat = 'Коворкінг'
            else if (desc.includes('оренд')) cat = 'Оренда'
            else if (desc.includes('іт') || desc.includes('it'))
              cat = 'ІТ-послуги'
            else cat = 'Інше'
          }

          categoriesMap[cat] = (categoriesMap[cat] || 0) + tr.amount
        }
      })
    })

    return Object.entries(categoriesMap).map(([type, value]) => ({
      type,
      value,
    }))
  }, [filteredData])

  const columnConfig = {
    data: columnData,
    xField: 'period',
    yField: 'value',
    colorField: 'type',
    isGroup: true,
    color: ['#1890ff', '#13c2c2', '#fa8c16', '#b37feb'],
    theme: isDarkMode ? 'dark' : 'light',
    axis: {
      x: {
        labelFill: token.colorTextSecondary,
        tickStroke: token.colorSplit,
      },
      y: {
        labelFill: token.colorTextSecondary,
        gridStroke: token.colorSplit,
      },
    },
    legend: {
      color: {
        position: 'bottom',
        itemLabelFill: token.colorText,
      },
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
      text: 'value',
      style: {
        fill: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
      },
    },
    legend: {
      color: {
        position: 'left',
        itemLabelFill: token.colorText,
      },
    },
  }

  return (
    <div
      style={{
        marginBottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">
              {t('profitPage:dashboard.plannedProfit')}
            </Text>
            <Statistic
              value={aggregatedData.plannedProfit}
              precision={2}
              suffix="грн"
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('profitPage:dashboard.details')} ↗
            </Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">
              {t('profitPage:dashboard.actualProfit')}
            </Text>
            <Statistic
              value={aggregatedData.actualProfit}
              precision={2}
              suffix="грн"
              valueStyle={{
                color: aggregatedData.profitDiff >= 0 ? '#3f8600' : '#cf1322',
              }}
              prefix={
                aggregatedData.profitDiff >= 0 ? (
                  <ArrowUpOutlined />
                ) : (
                  <ArrowDownOutlined />
                )
              }
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {aggregatedData.profitDiff.toFixed(1)}%{' '}
              {t('profitPage:dashboard.vsForecast')}
            </Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">
              {t('profitPage:dashboard.plannedExpense')}
            </Text>
            <Statistic
              value={aggregatedData.plannedExpense}
              precision={2}
              suffix="грн"
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('profitPage:dashboard.details')} ↗
            </Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Text type="secondary">
              {t('profitPage:dashboard.actualExpense')}
            </Text>
            <Statistic
              value={aggregatedData.actualExpense}
              precision={2}
              suffix="грн"
              valueStyle={{
                color: aggregatedData.expenseDiff <= 0 ? '#3f8600' : '#cf1322',
              }}
              prefix={
                aggregatedData.expenseDiff <= 0 ? (
                  <ArrowDownOutlined />
                ) : (
                  <ArrowUpOutlined />
                )
              }
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {Math.abs(aggregatedData.expenseDiff).toFixed(1)}%{' '}
              {t('profitPage:dashboard.vsForecast')}
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={14}>
          <Card
            title={t('profitPage:dashboard.trendTitle')}
            size="small"
            style={{ height: '100%' }}
          >
            <div style={{ height: 280 }}>
              {columnData.length > 0 ? (
                <Column {...columnConfig} />
              ) : (
                <Text type="secondary">Недостатньо даних</Text>
              )}
            </div>
          </Card>
        </Col>
        <Col span={10}>
          <Card
            title={t('profitPage:dashboard.structureTitle')}
            size="small"
            style={{ height: '100%' }}
          >
            <div style={{ height: 280, display: 'flex', alignItems: 'center' }}>
              {pieData.length > 0 ? (
                <Pie {...pieConfig} />
              ) : (
                <Text type="secondary">Недостатньо даних</Text>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ProfitDashboard
