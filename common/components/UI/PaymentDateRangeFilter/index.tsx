import { useMemo, useState } from 'react'
import { ConfigProvider, DatePicker } from 'antd'
import ukUA from 'antd/lib/locale/uk_UA'
import type { Dayjs } from 'dayjs'
import 'dayjs/locale/uk'
import cn from 'classnames'
import { useDateRangeHistory } from '@modules/hooks/useDateRangeHistory'
import { GLOBAL_HISTORY_SCOPE } from '@utils/dateRangeHistory'
import {
  PaymentDateRange,
  dateRangeFromPicker,
  dateRangeToPickerValue,
} from '@utils/paymentDateRange'
import RecentDateRanges from './RecentDateRanges'
import s from './style.module.scss'

const { RangePicker } = DatePicker

export interface PaymentDateRangeFilterProps {
  value?: Partial<PaymentDateRange> | null
  /** Called once both ends are picked, or with `null` when cleared. */
  onChange: (range: PaymentDateRange | null) => void
  /**
   * History bucket for the "Останні проміжки" panel (see
   * `getDateRangeHistoryScope`). Without it the panel is not shown.
   */
  historyScope?: string
  className?: string
}

const PaymentDateRangeFilter: React.FC<PaymentDateRangeFilterProps> = ({
  value,
  onChange,
  historyScope,
  className,
}) => {
  const [open, setOpen] = useState(false)
  const { items, record } = useDateRangeHistory(
    historyScope ?? GLOBAL_HISTORY_SCOPE
  )

  const { dateFrom, dateTo } = value ?? {}
  const pickerValue = useMemo(
    () => dateRangeToPickerValue({ dateFrom, dateTo }),
    [dateFrom, dateTo]
  )

  // The single "applied" point: both picker completion and a recent click go
  // through here, so intermediate calendar clicks never reach the history.
  const apply = (range: PaymentDateRange | null) => {
    if (range && historyScope) record(range)
    onChange(range)
  }

  const panelRender = historyScope
    ? (panel: React.ReactNode) => (
        <div className={s.panelWithRecent}>
          <RecentDateRanges
            items={items}
            active={value}
            onSelect={(range) => {
              apply(range)
              setOpen(false)
            }}
          />
          {panel}
        </div>
      )
    : undefined

  return (
    <ConfigProvider locale={ukUA}>
      <div className={cn(s.wrapper, className)}>
        <RangePicker
          className={s.picker}
          value={pickerValue}
          format="DD.MM.YYYY"
          placeholder={['Від', 'До']}
          allowClear
          open={open}
          onOpenChange={setOpen}
          panelRender={panelRender}
          onChange={(dates) =>
            apply(dateRangeFromPicker(dates as [Dayjs | null, Dayjs | null]))
          }
        />
      </div>
    </ConfigProvider>
  )
}

export default PaymentDateRangeFilter
