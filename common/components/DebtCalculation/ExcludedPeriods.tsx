import { CloseOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons'
import {
  Badge,
  Button,
  DatePicker,
  Popover,
  Select,
  Space,
  Switch,
  Tooltip,
  Typography,
} from 'antd'
import {
  cmu206Period,
  describeExcludedPeriod,
  EXCLUDED_PERIOD_TYPES,
  EXCLUSION_NOTE,
} from '@utils/debt-calculation/excludedPeriodPresets'
import {
  periodsWithin,
  type ExcludedPeriodType,
  type IExcludedPeriod,
} from '@utils/debt-calculation/exclusions'
import dayjs, { Dayjs } from 'dayjs'
import { useDebtCalculationContext } from './'
import s from './style.module.scss'

const ISO = 'YYYY-MM-DD'

const TYPE_OPTIONS = (
  Object.entries(EXCLUDED_PERIOD_TYPES) as [
    ExcludedPeriodType,
    { label: string },
  ][]
).map(([value, { label }]) => ({ value, label }))

let nextId = 0
const newId = (): string => `excluded-${Date.now()}-${(nextId += 1)}`

/** A period of a type: a preset brings its dates, a custom one starts empty. */
const periodOf = (type: ExcludedPeriodType, id = newId()): IExcludedPeriod => ({
  id,
  type,
  startDate: EXCLUDED_PERIOD_TYPES[type].startDate ?? '',
  endDate: EXCLUDED_PERIOD_TYPES[type].endDate ?? '',
})

/**
 * Periods with no inflation losses and no interest (a moratorium), next to
 * the rate. Settings of this calculation only - nothing is saved.
 */
const ExcludedPeriods: React.FC = () => {
  const {
    excludedPeriods = [],
    setExcludedPeriods,
    from,
    to,
  } = useDebtCalculationContext()

  // The calculation's span as dates, to see which exclusions touch it.
  const span: [string, string] | undefined =
    from && to
      ? [from.startOf('month').format(ISO), to.endOf('month').format(ISO)]
      : undefined
  const applying = span
    ? periodsWithin(excludedPeriods, span[0], span[1])
    : excludedPeriods
  const cmuOverlaps =
    !!span && periodsWithin([cmu206Period()], span[0], span[1]).length > 0
  const cmuOn = excludedPeriods.some(({ type }) => type === 'cmu_206')

  const switchCmu = (on: boolean): void =>
    setExcludedPeriods(
      on
        ? [...excludedPeriods, cmu206Period(newId())]
        : excludedPeriods.filter(({ type }) => type !== 'cmu_206')
    )

  const update = (id: string, patch: Partial<IExcludedPeriod>): void =>
    setExcludedPeriods(
      excludedPeriods.map((period) =>
        period.id === id ? { ...period, ...patch } : period
      )
    )

  const changeDates = (id: string, range: [Dayjs, Dayjs] | null): void =>
    update(id, {
      startDate: range?.[0]?.format(ISO) ?? '',
      endDate: range?.[1]?.format(ISO) ?? '',
      // Other dates than the preset's are no longer that preset.
      type: 'custom',
    })

  const content = (
    <div className={s.Exclusions}>
      {excludedPeriods.length === 0 && (
        <Typography.Text type="secondary">
          Немає. Додайте період, за який не нараховувати інфляційні та річні.
        </Typography.Text>
      )}
      {excludedPeriods.map((period) => (
        <div key={period.id} className={s.ExclusionRow}>
          <DatePicker.RangePicker
            value={
              period.startDate && period.endDate
                ? [dayjs(period.startDate), dayjs(period.endDate)]
                : null
            }
            onChange={(range) =>
              changeDates(period.id, range as [Dayjs, Dayjs] | null)
            }
            format="DD.MM.YYYY"
            aria-label="Виключений період"
            allowClear={false}
          />
          <Select
            value={period.type}
            options={TYPE_OPTIONS}
            onChange={(type) => update(period.id, periodOf(type, period.id))}
            aria-label="Тип виключення"
            className={s.ExclusionType}
          />
          <Button
            type="text"
            icon={<CloseOutlined />}
            aria-label="Прибрати період"
            onClick={() =>
              setExcludedPeriods(
                excludedPeriods.filter(({ id }) => id !== period.id)
              )
            }
          />
        </div>
      ))}
      <div className={s.ExclusionActions}>
        <Button
          size="small"
          icon={<PlusOutlined />}
          onClick={() =>
            setExcludedPeriods([...excludedPeriods, periodOf('custom')])
          }
        >
          Додати період
        </Button>
      </div>
      <Typography.Text type="secondary" className={s.ExclusionNote}>
        {EXCLUSION_NOTE} Зберігаються разом з розрахунком цієї компанії.
      </Typography.Text>
    </div>
  )

  return (
    <Space size="small">
      {cmuOverlaps && (
        <Tooltip
          title={`${describeExcludedPeriod(cmu206Period())}. Для нового розрахунку ввімкнений одразу; збережений розрахунок лишається як є.`}
        >
          <label className={s.CmuSwitch}>
            <Switch
              size="small"
              checked={cmuOn}
              onChange={switchCmu}
              aria-label="Мораторій КМУ №206"
            />
            <span>КМУ №206</span>
          </label>
        </Tooltip>
      )}
      <Popover
        title="Виключені періоди"
        trigger="click"
        placement="bottomRight"
        content={content}
      >
        <Badge count={applying.length} size="small">
          <Button icon={<StopOutlined />} aria-label="Виключені періоди" />
        </Badge>
      </Popover>
    </Space>
  )
}

export default ExcludedPeriods
