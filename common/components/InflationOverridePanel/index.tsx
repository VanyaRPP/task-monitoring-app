import type { IDebtPeriod } from '@utils/debt-calculation/company-debt'
import { defaultDebtPeriod } from '@utils/debt-calculation/company-debt'
import { formatPeriod } from '@utils/debt-calculation/months'
import { Collapse, ConfigProvider, DatePicker, Flex, Segmented } from 'antd'
import ukUA from 'antd/lib/locale/uk_UA'
import dayjs, { Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import IndexChart from './IndexChart'
import IndexTable from './IndexTable'

export interface IDomainOption {
  text: string
  value: string
}

// The index of a particular domain is hidden for now: the panel shows only the
// official one and does not read these. The page still passes them.
interface Props {
  domains: IDomainOption[]
  preferredDomainId?: string
}

/** The API refuses a longer range. */
const MAX_MONTHS = 120

type View = 'chart' | 'table'

const toDate = (period: IDebtPeriod['from']): Dayjs =>
  dayjs(`${formatPeriod(period)}-01`)

const toYearMonth = (date: Dayjs): IDebtPeriod['from'] => ({
  year: date.year(),
  month: date.month() + 1,
})

const InflationIndex: React.FC = () => {
  const [view, setView] = useState<View>('chart')
  const [pickedPeriod, setPickedPeriod] = useState<IDebtPeriod | null>(null)
  const defaultPeriod = useMemo(() => defaultDebtPeriod(), [])
  // The picker belongs to the chart: the table always has the whole history.
  const period = pickedPeriod ?? defaultPeriod

  return (
    <Flex vertical gap={12}>
      <Flex wrap gap={8} align="center">
        {view === 'chart' && (
          <ConfigProvider locale={ukUA}>
            <DatePicker.RangePicker
              picker="month"
              format="MM.YYYY"
              placeholder={['Від місяця', 'До місяця']}
              value={[toDate(period.from), toDate(period.to)]}
              disabledDate={(date, { from }) =>
                !!from && Math.abs(date.diff(from, 'month')) >= MAX_MONTHS
              }
              onChange={(dates) =>
                setPickedPeriod(
                  dates?.[0] && dates?.[1]
                    ? {
                        from: toYearMonth(dates[0]),
                        to: toYearMonth(dates[1]),
                      }
                    : null
                )
              }
            />
          </ConfigProvider>
        )}
        <Segmented<View>
          style={{ marginLeft: 'auto' }}
          options={[
            { label: 'Графік', value: 'chart' },
            { label: 'Таблиця', value: 'table' },
          ]}
          value={view}
          onChange={setView}
        />
      </Flex>
      {view === 'chart' ? <IndexChart period={period} /> : <IndexTable />}
    </Flex>
  )
}

const InflationOverridePanel: React.FC<Props> = () => (
  <Collapse
    size="small"
    style={{ marginTop: 16 }}
    items={[
      {
        key: 'inflation',
        label: 'Індекс інфляції',
        children: <InflationIndex />,
      },
    ]}
  />
)

export default InflationOverridePanel
