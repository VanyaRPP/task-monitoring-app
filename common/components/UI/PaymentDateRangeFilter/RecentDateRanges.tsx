import { Button, Typography, theme } from 'antd'
import cn from 'classnames'
import {
  DateHistoryItem,
  formatDateRangeHistoryLabel,
} from '@utils/dateRangeHistory'
import { PaymentDateRange } from '@utils/paymentDateRange'
import s from './style.module.scss'

export interface RecentDateRangesProps {
  items: DateHistoryItem[]
  active?: Partial<PaymentDateRange> | null
  onSelect: (range: PaymentDateRange) => void
}

const RecentDateRanges: React.FC<RecentDateRangesProps> = ({
  items,
  active,
  onSelect,
}) => {
  const { token } = theme.useToken()
  return (
    <nav
      className={s.recent}
      style={{ borderColor: token.colorSplit }}
      aria-label="Останні проміжки"
    >
      <Typography.Text strong className={s.recentTitle}>
        Останні проміжки
      </Typography.Text>
      {items.length ? (
        <ul className={s.recentList}>
          {items.map((item) => {
            const isActive =
              active?.dateFrom === item.from && active?.dateTo === item.to
            const exact = `${item.from} — ${item.to}`
            return (
              <li key={exact}>
                <Button
                  type="text"
                  size="small"
                  block
                  title={exact}
                  aria-pressed={isActive}
                  className={cn(s.recentItem, {
                    [s.recentItemActive]: isActive,
                  })}
                  onClick={() =>
                    onSelect({ dateFrom: item.from, dateTo: item.to })
                  }
                >
                  {formatDateRangeHistoryLabel(item)}
                </Button>
              </li>
            )
          })}
        </ul>
      ) : (
        <Typography.Text type="secondary" className={s.recentEmpty}>
          Тут з&apos;являться застосовані проміжки
        </Typography.Text>
      )}
    </nav>
  )
}

export default RecentDateRanges
