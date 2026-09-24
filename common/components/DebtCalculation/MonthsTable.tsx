import { IDebtCalculationResult } from '@utils/debt-calculation/types'
import { formatPeriod } from '@utils/debt-calculation/months'
import { InputNumber, Table, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useDebtCalculationContext } from './'
import { formatCoefficient, formatMoney, formatMonthLabel } from './format'
import s from './style.module.scss'

type MonthRow = IDebtCalculationResult['rows'][number]

interface Props {
  result: IDebtCalculationResult
}

const MonthsTable: React.FC<Props> = ({ result }) => {
  const {
    overrides,
    prefillMonths,
    indexByPeriod,
    setMonthOverride,
    inflationMethod,
  } = useDebtCalculationContext()

  const monthOverrides = overrides.months ?? {}
  const prefill = prefillMonths ?? {}

  const patch = (row: MonthRow, field: string, value: number | null) =>
    setMonthOverride(formatPeriod(row), {
      [field]: value == null ? undefined : Number(value),
    })

  /**
   * Shows the manual edit, falling back to what was prefilled from the DB.
   * Both render as a real value rather than a placeholder: 500 UAH paid, shown
   * in grey, would read as an empty field.
   */
  const valueOf = (
    row: MonthRow,
    field: 'paid' | 'charged' | 'area' | 'tariff' | 'inflationIndex'
  ): number | undefined => {
    const period = formatPeriod(row)

    return monthOverrides[period]?.[field] ?? prefill[period]?.[field]
  }

  const columns: ColumnsType<MonthRow> = [
    {
      title: 'Місяць',
      width: 130,
      fixed: 'left',
      render: (_, row) => formatMonthLabel(row.year, row.month),
    },
    {
      title: 'Сплачено',
      width: 120,
      render: (_, row) => (
        <InputNumber
          size="small"
          min={0}
          value={valueOf(row, 'paid')}
          placeholder="0.00"
          onChange={(value) => patch(row, 'paid', value as number)}
        />
      ),
    },
    {
      title: 'Нараховано',
      width: 130,
      render: (_, row) => (
        <InputNumber
          size="small"
          min={0}
          value={valueOf(row, 'charged')}
          // An empty field means "derive area × tariff", so the derived value
          // shows as the placeholder - you can see what you are overriding.
          placeholder={formatMoney(row.charged)}
          onChange={(value) => patch(row, 'charged', value as number)}
        />
      ),
    },
    {
      title: 'Площа, м²',
      width: 110,
      render: (_, row) => (
        <InputNumber
          size="small"
          min={0}
          value={valueOf(row, 'area')}
          placeholder={String(row.area)}
          onChange={(value) => patch(row, 'area', value as number)}
        />
      ),
    },
    {
      title: 'Тариф, грн/м²',
      width: 120,
      render: (_, row) => (
        <InputNumber
          size="small"
          min={0}
          value={valueOf(row, 'tariff')}
          placeholder={String(row.tariff)}
          onChange={(value) => patch(row, 'tariff', value as number)}
        />
      ),
    },
    {
      title: `${'Річних'}`,
      width: 110,
      align: 'right',
      render: (_, row) => formatMoney(row.interest),
    },
    {
      title: 'Сума боргу',
      width: 120,
      align: 'right',
      render: (_, row) => <strong>{formatMoney(row.debt)}</strong>,
    },
    {
      title: 'Днів',
      width: 70,
      align: 'right',
      dataIndex: 'days',
    },
    {
      title: 'Індекс, %',
      width: 110,
      render: (_, row) => {
        const override = valueOf(row, 'inflationIndex')
        // Ask the reference table, never the value: an index of exactly 100 is
        // a real published figure (a month with no price change), and the
        // engine also falls back to 100 when nothing is known. Comparing to
        // 100 flagged both as missing.
        const isMissing =
          override == null && indexByPeriod[formatPeriod(row)] == null
        const input = (
          <InputNumber
            size="small"
            min={0}
            step={0.1}
            status={isMissing ? 'error' : undefined}
            value={override}
            aria-label={`Індекс інфляції за ${formatMonthLabel(
              row.year,
              row.month
            )}`}
            placeholder={String(row.inflationIndex)}
            onChange={(value) => patch(row, 'inflationIndex', value as number)}
          />
        )

        return isMissing ? (
          <Tooltip title="Індексу за цей місяць немає в довіднику — узято 100, тобто без зміни. Впишіть значення вручну або досійте довідник.">
            {input}
          </Tooltip>
        ) : (
          input
        )
      },
    },
    {
      title: 'Коеф.',
      width: 100,
      align: 'right',
      render: (_, row) => formatCoefficient(row.coefficient),
    },
    {
      title: 'Інфляційні',
      width: 130,
      align: 'right',
      render: (_, row) => formatMoney(row.inflationLoss),
    },
  ]

  return (
    <div className={s.MonthsWrap}>
      <Table<MonthRow>
        size="small"
        bordered
        pagination={false}
        scroll={{ x: 'max-content' }}
        rowKey={(row) => formatPeriod(row)}
        columns={columns}
        dataSource={result.rows}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <strong>Всього</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                {formatMoney(result.totals.paid)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                {formatMoney(result.totals.charged)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} colSpan={2} />
              <Table.Summary.Cell index={5} align="right">
                <strong>{formatMoney(result.interest)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} align="right">
                <strong>{formatMoney(result.body)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} align="right">
                {result.totals.days}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8} colSpan={2} align="right">
                {formatCoefficient(result.coefficient)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={10} align="right">
                <strong>{formatMoney(result.inflation)}</strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
      <Typography.Paragraph type="secondary" className={s.TableNote}>
        {inflationMethod === 'balance'
          ? 'Інфляційні у підсумку — це значення останнього місяця, а не сума по колонці: коефіцієнт накопичувальний.'
          : 'Помісячний метод: кожне нарахування індексується від свого місяця, оплати гасять найстаріший борг.'}
      </Typography.Paragraph>
    </div>
  )
}

export default MonthsTable
