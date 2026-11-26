import type { IDomainOption } from '@components/InflationOverridePanel'
import type { IServiceHistory } from '@modules/hooks/useServiceHistory'
import { DatePicker, Flex, Select } from 'antd'
import s from './style.module.scss'

interface Props {
  domains: IDomainOption[]
  history: IServiceHistory
  /** Extra controls of a particular chart, after the filters. */
  children?: React.ReactNode
}

const ServiceHistoryFilters: React.FC<Props> = ({
  domains,
  history,
  children,
}) => (
  <Flex wrap gap={8} align="center">
    <Select
      value={history.domainId}
      onChange={history.setDomainId}
      options={domains.map(({ text, value }) => ({ label: text, value }))}
      aria-label="Домен"
      className={s.select}
      showSearch
      optionFilterProp="label"
    />
    <Select
      value={history.address}
      onChange={history.setAddress}
      options={history.addresses}
      aria-label="Адреса"
      placeholder="Адреса"
      className={s.select}
      showSearch
      optionFilterProp="label"
    />
    <DatePicker.RangePicker
      picker="month"
      format="MM.YYYY"
      placeholder={['Від місяця', 'До місяця']}
      value={history.period}
      onChange={(dates) =>
        history.setPeriod(
          dates?.[0] && dates?.[1] ? [dates[0], dates[1]] : null
        )
      }
    />
    {children}
  </Flex>
)

export default ServiceHistoryFilters
