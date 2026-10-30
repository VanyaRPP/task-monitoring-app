import { CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, DatePicker, InputNumber, Popover, Typography } from 'antd'
import {
  ChangeField,
  IValueChange,
  normalizeChanges,
} from '@utils/debt-calculation/changes'
import dayjs, { Dayjs } from 'dayjs'
import { useDebtCalculationContext } from './'
import s from './style.module.scss'

const PERIOD = 'YYYY-MM'

interface IValueChangesProps {
  field: ChangeField
  /** The field's name as above the table, e.g. «Тариф, грн/м²». */
  label: string
  /** What applies before the first change when the field itself is empty. */
  placeholder: string
}

const changesLabel = (count: number): string => {
  if (count === 0) return '+ зміна'
  const tens = count % 100
  const ones = count % 10
  const word =
    ones === 1 && tens !== 11
      ? 'зміна'
      : ones >= 2 && ones <= 4 && (tens < 12 || tens > 14)
        ? 'зміни'
        : 'змін'
  return `${count} ${word}`
}

/**
 * The later values of one company-wide field: «з 02.2019 — 5,89». Each holds
 * until the next; the field itself stands for the months before the first.
 */
const ValueChanges: React.FC<IValueChangesProps> = ({
  field,
  label,
  placeholder,
}) => {
  const { overrides, setApartmentOverride, from, to } =
    useDebtCalculationContext()
  const changes = overrides.changes?.[field] ?? []

  const save = (next: IValueChange[]): void =>
    setApartmentOverride({
      changes: {
        ...overrides.changes,
        [field]: next.length > 0 ? normalizeChanges(next) : undefined,
      },
    })

  // A new change starts a month after the last one (or the period start) and
  // carries its value, so a rise is one edit of the number.
  const add = (): void => {
    const last = changes[changes.length - 1]
    const after = last ? dayjs(`${last.from}-01`) : from
    const month = (after ?? dayjs()).add(1, 'month')
    const limit = to?.startOf('month')
    save([
      ...changes,
      {
        from: (limit && month.isAfter(limit) ? limit : month).format(PERIOD),
        value: last?.value ?? overrides[field] ?? 0,
      },
    ])
  }

  const update = (index: number, patch: Partial<IValueChange>): void =>
    save(
      changes.map((change, at) =>
        at === index ? { ...change, ...patch } : change
      )
    )

  const content = (
    <div className={s.Changes}>
      <div className={s.ChangeRow}>
        <span className={s.ChangeFrom}>з початку періоду</span>
        <Typography.Text>{overrides[field] ?? placeholder}</Typography.Text>
      </div>
      {changes.map((change, index) => (
        <div key={change.from} className={s.ChangeRow}>
          <DatePicker
            picker="month"
            format="MM.YYYY"
            value={dayjs(`${change.from}-01`)}
            onChange={(value: Dayjs | null) =>
              value && update(index, { from: value.format(PERIOD) })
            }
            allowClear={false}
            aria-label={`${label}: з місяця`}
            className={s.ChangeFrom}
          />
          <InputNumber
            min={field === 'correction' ? undefined : 0}
            value={change.value}
            onChange={(value) =>
              value != null && update(index, { value: Number(value) })
            }
            aria-label={`${label}: значення`}
          />
          <Button
            type="text"
            icon={<CloseOutlined />}
            aria-label="Прибрати зміну"
            onClick={() => save(changes.filter((_, at) => at !== index))}
          />
        </div>
      ))}
      <Button size="small" icon={<PlusOutlined />} onClick={add}>
        Додати зміну
      </Button>
      <Typography.Text type="secondary" className={s.ExclusionNote}>
        Кожне значення діє з указаного місяця до наступної зміни. Значення,
        введене в самому місяці або взяте з платежів, має перевагу.
      </Typography.Text>
    </div>
  )

  return (
    <Popover
      title={`${label}: зміни`}
      trigger="click"
      placement="bottomLeft"
      content={content}
    >
      <Button
        type="link"
        size="small"
        className={s.ChangesButton}
        aria-label={`${label}: зміни з місяця`}
      >
        {changesLabel(changes.length)}
      </Button>
    </Popover>
  )
}

export default ValueChanges
