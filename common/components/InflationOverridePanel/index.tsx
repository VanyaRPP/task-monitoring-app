import {
  useGetDomainInflationIndexesQuery,
  useResetDomainInflationOverrideMutation,
  useSetDomainInflationOverrideMutation,
} from '@common/api/inflationIndexApi/inflationIndex.api'
import type { IDomainIndexMonth } from '@common/api/inflationIndexApi/inflationIndex.api.types'
import { formatMonthLabel } from '@components/DebtCalculation/format'
import { defaultDebtPeriod } from '@utils/debt-calculation/company-debt'
import { formatPeriod } from '@utils/debt-calculation/months'
import {
  Button,
  Collapse,
  InputNumber,
  message,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

export interface IDomainOption {
  text: string
  value: string
}

interface Props {
  domains: IDomainOption[]
  preferredDomainId?: string
}

const formatIndex = (value?: number | null): string =>
  value == null ? '—' : value.toFixed(1)

const errorMessage = (error: unknown, fallback: string): string =>
  (error as { data?: { message?: string } })?.data?.message ?? fallback

const InflationOverridePanel: React.FC<Props> = ({
  domains,
  preferredDomainId,
}) => {
  const [domainId, setDomainId] = useState<string | undefined>(
    preferredDomainId ?? domains[0]?.value
  )
  const [editing, setEditing] = useState<{
    period: string
    value: number | null
  } | null>(null)

  useEffect(() => {
    if (preferredDomainId) setDomainId(preferredDomainId)
  }, [preferredDomainId])

  useEffect(() => {
    if (!domainId && domains[0]) setDomainId(domains[0].value)
  }, [domainId, domains])

  useEffect(() => setEditing(null), [domainId])

  const period = useMemo(() => defaultDebtPeriod(), [])
  const { data, isFetching } = useGetDomainInflationIndexesQuery(
    {
      domainId: domainId as string,
      from: formatPeriod(period.from),
      to: formatPeriod(period.to),
    },
    { skip: !domainId }
  )
  const [setOverride, { isLoading: isSaving }] =
    useSetDomainInflationOverrideMutation()
  const [resetOverride, { isLoading: isResetting }] =
    useResetDomainInflationOverrideMutation()

  const canEdit = !!data?.canEdit
  const months = useMemo(() => [...(data?.months ?? [])].reverse(), [data])

  const save = async (row: IDomainIndexMonth) => {
    if (!domainId || editing?.value == null) return
    try {
      await setOverride({
        domainId,
        year: row.year,
        month: row.month,
        value: editing.value,
      }).unwrap()
      message.success('Індекс для домену збережено')
      setEditing(null)
    } catch (error) {
      message.error(errorMessage(error, 'Не вдалося зберегти індекс'))
    }
  }

  const reset = async (row: IDomainIndexMonth) => {
    if (!domainId) return
    try {
      await resetOverride({
        domainId,
        year: row.year,
        month: row.month,
      }).unwrap()
      message.success('Повернуто значення довідника')
    } catch (error) {
      message.error(errorMessage(error, 'Не вдалося скинути індекс'))
    }
  }

  const columns: ColumnsType<IDomainIndexMonth> = [
    {
      title: 'Місяць',
      render: (_, row) => formatMonthLabel(row.year, row.month),
    },
    {
      title: 'Довідник',
      align: 'right',
      render: (_, row) => formatIndex(row.reference),
    },
    {
      title: 'Для домену',
      render: (_, row) => {
        if (editing?.period === formatPeriod(row)) {
          return (
            <InputNumber
              size="small"
              min={90}
              max={120}
              step={0.1}
              autoFocus
              value={editing.value}
              aria-label={`Індекс домену за ${formatMonthLabel(
                row.year,
                row.month
              )}`}
              onChange={(value) =>
                setEditing({ period: formatPeriod(row), value })
              }
              onPressEnter={() => save(row)}
            />
          )
        }

        if (!row.override) return '—'

        const changed = [
          row.override.updatedBy,
          row.override.updatedAt &&
            dayjs(row.override.updatedAt).format('DD.MM.YYYY HH:mm'),
        ]
          .filter(Boolean)
          .join(', ')

        return (
          <Space size="small">
            {formatIndex(row.override.value)}
            <Tooltip title={changed ? `Змінено: ${changed}` : undefined}>
              <Tag color="orange">змінено для домену</Tag>
            </Tooltip>
          </Space>
        )
      },
    },
  ]

  if (canEdit) {
    columns.push({
      title: '',
      align: 'right',
      render: (_, row) => {
        if (editing?.period === formatPeriod(row)) {
          return (
            <Space size="small">
              <Button
                size="small"
                type="primary"
                loading={isSaving}
                disabled={editing.value == null}
                onClick={() => save(row)}
              >
                Зберегти
              </Button>
              <Button size="small" onClick={() => setEditing(null)}>
                Скасувати
              </Button>
            </Space>
          )
        }

        return (
          <Space size="small">
            <Button
              size="small"
              onClick={() =>
                setEditing({ period: formatPeriod(row), value: row.value })
              }
            >
              Змінити
            </Button>
            {row.override && (
              <Popconfirm
                title="Повернути значення з довідника?"
                okText="Скинути"
                cancelText="Ні"
                onConfirm={() => reset(row)}
              >
                <Button size="small" danger loading={isResetting}>
                  Скинути до довідника
                </Button>
              </Popconfirm>
            )}
          </Space>
        )
      },
    })
  }

  return (
    <Collapse
      size="small"
      style={{ marginTop: 16 }}
      items={[
        {
          key: 'inflation',
          label: 'Індекс інфляції домену',
          children: (
            <Space direction="vertical" style={{ width: '100%' }}>
              {domains.length > 1 && (
                <Select
                  value={domainId}
                  onChange={setDomainId}
                  options={domains.map(({ text, value }) => ({
                    label: text,
                    value,
                  }))}
                  aria-label="Домен"
                  style={{ minWidth: 240 }}
                  showSearch
                  optionFilterProp="label"
                />
              )}
              <Table<IDomainIndexMonth>
                size="small"
                pagination={false}
                rowKey={(row) => formatPeriod(row)}
                columns={columns}
                dataSource={months}
                loading={isFetching}
              />
              {data && !canEdit && (
                <Typography.Text type="secondary">
                  Лише перегляд: змінювати індекс може адміністратор домену.
                </Typography.Text>
              )}
            </Space>
          ),
        },
      ]}
    />
  )
}

export default InflationOverridePanel
