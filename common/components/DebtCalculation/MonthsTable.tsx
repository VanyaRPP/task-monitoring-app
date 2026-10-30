import { IDebtCalculationResult } from '@utils/debt-calculation/types'
import type { IExcludedPeriod } from '@utils/debt-calculation/exclusions'
import { formatPeriod } from '@utils/debt-calculation/months'
import {
  CameraOutlined,
  CheckOutlined,
  CloseOutlined,
  MinusCircleOutlined,
  StopOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import { ChangeField, changesInMonth } from '@utils/debt-calculation/changes'
import { describeExcludedPeriod } from '@utils/debt-calculation/excludedPeriodPresets'
import { periodsInMonth } from '@utils/debt-calculation/exclusions'
import { daysInMonth } from '@utils/debt-calculation/months'
import { InputNumber, Table, Tooltip, Typography } from 'antd'
import type { ColumnsType, ColumnType } from 'antd/es/table'
import { useDebtCalculationContext } from './'
import { formatCoefficient, formatMoney, formatMonthLabel } from './format'
import { EVERY_MONTH_HINT, GeneralInput, StartDaySelect } from './GeneralFields'
import s from './style.module.scss'

type MonthRow = IDebtCalculationResult['rows'][number]

/** A table row: a month, or the row of values for every month above them. */
type TableRow = MonthRow & { general?: true }

const GENERAL_ROW = { general: true } as TableRow

interface Props {
  result: IDebtCalculationResult
}

/**
 * A narrow mark per month: whether inflation losses and interest accrued.
 * Shape and label, not only colour, tell the three states apart.
 */
const exclusionColumn = (
  periods: IExcludedPeriod[]
): ColumnsType<MonthRow>[number] => ({
  title: (
    <Tooltip title="Нарахування інфляційних і річних: ✓ — так, ✕ — виключено, ◐ — частину місяця">
      <StopOutlined aria-label="Виключені періоди" />
    </Tooltip>
  ),
  width: 36,
  align: 'center',
  render: (_, row) => {
    const total = daysInMonth(row.year, row.month)
    if (row.excludedDays === 0) {
      return (
        <CheckOutlined
          aria-label="Нараховується"
          className={`${s.ExclusionMark} ${s.ExclusionAllowed}`}
        />
      )
    }
    const why = periodsInMonth(periods, row.year, row.month)
      .map(describeExcludedPeriod)
      .join('; ')
    const whole = row.excludedDays >= total
    const label = whole
      ? `Не нараховується: ${why}`
      : `Виключено ${row.excludedDays} з ${total} днів (${why}). Річні — за ${row.days} дн.; індекс місяця ${row.indexApplied ? 'враховано' : 'не враховано'}.`
    return (
      <Tooltip title={label}>
        {whole ? (
          <CloseOutlined
            aria-label={label}
            className={`${s.ExclusionMark} ${s.ExclusionExcluded}`}
          />
        ) : (
          <MinusCircleOutlined
            aria-label={label}
            className={`${s.ExclusionMark} ${s.ExclusionPartial}`}
          />
        )}
      </Tooltip>
    )
  },
})

const CHANGE_LABEL: Record<ChangeField, string> = {
  area: 'площа',
  tariff: 'тариф',
  charged: 'нараховано',
  paid: 'сплачено',
  correction: 'коректура',
}

const MonthsTable: React.FC<Props> = ({ result }) => {
  const {
    overrides,
    prefillMonths,
    indexByPeriod,
    setMonthOverride,
    inflationMethod,
    excludedPeriods = [],
    company,
    openingDebtPrefill,
  } = useDebtCalculationContext()
  const hasExclusions = excludedPeriods.length > 0

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
    field:
      | 'paid'
      | 'charged'
      | 'correction'
      | 'area'
      | 'tariff'
      | 'inflationIndex'
      | 'days'
  ): number | undefined => {
    const period = formatPeriod(row)

    const value = monthOverrides[period]?.[field] ?? prefill[period]?.[field]
    // An index of 0 is no index: the engine takes 100, and so does the cell.
    return field === 'inflationIndex' && value === 0 ? undefined : value
  }

  const leaves: ColumnsType<MonthRow> = [
    {
      title: 'Місяць',
      fixed: 'left',
      render: (_, row) => {
        const changed = changesInMonth(overrides.changes, row)
        const mark = changed.length > 0 && (
          <Tooltip
            title={`З цього місяця: ${changed
              .map(({ field, value }) => `${CHANGE_LABEL[field]} ${value}`)
              .join(', ')}`}
          >
            <SwapOutlined
              aria-label="Зміна загального значення"
              className={s.ChangeMark}
            />
          </Tooltip>
        )
        return monthOverrides[formatPeriod(row)]?.source === 'photo' ? (
          <>
            <Tooltip title="Заповнено з фото — перевірте. Будь-яка правка місяця знімає позначку.">
              <span className={s.FromPhoto}>
                <CameraOutlined /> {formatMonthLabel(row.year, row.month)}
              </span>
            </Tooltip>
            {mark}
          </>
        ) : (
          <>
            {formatMonthLabel(row.year, row.month)}
            {mark}
          </>
        )
      },
    },
    {
      title: (
        <Tooltip title="Борг на початок місяця — вихідне сальдо попереднього.">
          Вхідне сальдо
        </Tooltip>
      ),
      align: 'right',
      render: (_, row) => formatMoney(row.opening),
    },
    {
      title: 'Сплачено',
      render: (_, row) => (
        <InputNumber
          size="small"
          min={0}
          value={valueOf(row, 'paid')}
          // A general figure (or its change) shows here, as the charge does.
          placeholder={formatMoney(row.paid)}
          onChange={(value) => patch(row, 'paid', value as number)}
        />
      ),
    },
    {
      title: 'Нараховано',
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
      title: (
        <Tooltip title="Перерахунок за місяць як зміна боргу: мінус зменшує борг, плюс збільшує. У роздруківках білінгу — колонка «Коректура».">
          Коректура
        </Tooltip>
      ),
      render: (_, row) => (
        <InputNumber
          size="small"
          value={valueOf(row, 'correction')}
          placeholder={formatMoney(row.correction)}
          onChange={(value) => patch(row, 'correction', value as number)}
        />
      ),
    },
    {
      title: 'Площа, м²',
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
      align: 'right',
      render: (_, row) => formatMoney(row.interest),
    },
    {
      title: (
        <Tooltip title="Сума боргу на кінець місяця.">Вихідне сальдо</Tooltip>
      ),
      align: 'right',
      render: (_, row) => <strong>{formatMoney(row.debt)}</strong>,
    },
    {
      title: (
        <Tooltip title="Днів нарахування в місяці. Можна змінити: Нараховано (якщо не введене вручну) і 3% річних рахуються за цими днями. Дні виключених періодів віднімаються від річних окремо.">
          Днів
        </Tooltip>
      ),
      align: 'right',
      render: (_, row) => (
        <InputNumber
          size="small"
          min={0}
          max={daysInMonth(row.year, row.month)}
          precision={0}
          value={valueOf(row, 'days')}
          placeholder={String(row.days)}
          // Nothing to change in a month that is wholly excluded.
          disabled={row.excludedDays >= daysInMonth(row.year, row.month)}
          onChange={(value) => patch(row, 'days', value as number)}
          aria-label={`Днів, ${formatMonthLabel(row.year, row.month)}`}
        />
      ),
    },
    {
      title: 'Індекс, %',
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
            precision={1}
            placeholder={row.inflationIndex.toFixed(1)}
            onChange={(value) =>
              patch(row, 'inflationIndex', value ? Number(value) : null)
            }
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
      align: 'right',
      render: (_, row) => formatCoefficient(row.coefficient),
    },
    {
      title: 'Інфляційні',
      align: 'right',
      render: (_, row) => formatMoney(row.inflationLoss),
    },
    ...(hasExclusions ? [exclusionColumn(excludedPeriods)] : []),
  ]

  /**
   * The row of company-wide values: each over the column it fills,
   * by the column's place (the same places the totals row uses).
   */
  const general: Record<number, React.ReactNode> = {
    0: (
      <Tooltip title={EVERY_MONTH_HINT}>
        <span className={s.GeneralTitle}>Для всіх місяців</span>
      </Tooltip>
    ),
    1: (
      <GeneralInput
        field="openingDebt"
        label="Борг на початок періоду"
        placeholder={(openingDebtPrefill ?? 0).toFixed(2)}
      />
    ),
    2: (
      <GeneralInput field="paid" label="Сплачено щомісяця" placeholder="0.00" />
    ),
    3: (
      <GeneralInput
        field="charged"
        label="Нараховано щомісяця"
        placeholder="авто"
      />
    ),
    4: (
      <GeneralInput
        field="correction"
        label="Коректура щомісяця"
        placeholder="0.00"
      />
    ),
    5: (
      <GeneralInput
        field="area"
        label="Площа, м²"
        placeholder={String(company?.totalArea ?? 0)}
      />
    ),
    6: (
      <GeneralInput
        field="tariff"
        label="Тариф, грн/м²"
        placeholder={String(company?.pricePerMeter ?? 0)}
      />
    ),
    9: <StartDaySelect />,
  }

  // The first row of the table holds them, in the very cells the months
  // below use - not the header: a column's title is also copied into a
  // hidden measuring row, which would render every input twice.
  const columns: ColumnsType<TableRow> = leaves.map((leaf, index) => {
    const column = leaf as ColumnType<TableRow>
    return {
      ...column,
      // A 1px width in an auto-sized table means "as narrow as the content":
      // the spare width then goes to the month column alone instead of
      // padding every figure. Long titles wrap onto two lines.
      width: index === 0 ? undefined : (column.width ?? 1),
      render: (value, row, at) =>
        row.general ? (general[index] ?? null) : column.render(value, row, at),
    }
  })

  return (
    <div className={s.MonthsWrap}>
      <Table<TableRow>
        size="small"
        bordered
        pagination={false}
        scroll={{ x: 'max-content' }}
        rowKey={(row) => (row.general ? 'general' : formatPeriod(row))}
        rowClassName={(row) => (row.general ? s.GeneralRow : '')}
        columns={columns}
        dataSource={[GENERAL_ROW, ...result.rows]}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <strong>Всього</strong>
              </Table.Summary.Cell>
              {/* Openings are not summed - each is the month before's closing. */}
              <Table.Summary.Cell index={1} />
              <Table.Summary.Cell index={2}>
                {formatMoney(result.totals.paid)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3}>
                {formatMoney(result.totals.charged)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4}>
                {formatMoney(result.totals.correction)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} colSpan={2} />
              <Table.Summary.Cell index={7} align="right">
                <strong>{formatMoney(result.interest)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8} align="right">
                <strong>{formatMoney(result.body)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={9} align="right">
                {result.totals.days}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={10} colSpan={2} align="right">
                {formatCoefficient(result.coefficient)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={12} align="right">
                <strong>{formatMoney(result.inflation)}</strong>
              </Table.Summary.Cell>
              {hasExclusions && <Table.Summary.Cell index={13} />}
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
