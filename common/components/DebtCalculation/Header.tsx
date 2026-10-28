import { FileExcelOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import {
  Button,
  DatePicker,
  InputNumber,
  Select,
  Space,
  Tooltip,
  Typography,
} from 'antd'
import { useMemo, useState } from 'react'
import { useDebtCalculationContext } from './'
import CreatePayments from './CreatePayments'
import ExcludedPeriods from './ExcludedPeriods'
import PrintPreview from './PrintPreview'
import { useExportExcel } from './useExportExcel'
import s from './style.module.scss'

const METHOD_HINT =
  'За залишком — як у паперовому Акті ОСББ: сукупний коефіцієнт за весь ' +
  'період множиться на весь поточний залишок боргу. Помісячний — як вимагає ' +
  'ст. 625 ЦК: кожне нарахування індексується від свого місяця, оплати ' +
  'гасять найстаріший борг. Помісячний дає помітно меншу суму.'

/** The street filter's value for companies that have no address. */
export const NO_STREET = '__no-street__'

const streetKey = (street: unknown): string =>
  (street as { _id?: string } | undefined)?._id ?? NO_STREET

const DebtCalculationHeader: React.FC = () => {
  const {
    domainId,
    setDomainId,
    allowedDomainIds,
    companies,
    companyId,
    setCompanyId,
    from,
    to,
    setFrom,
    setTo,
    annualRatePercent,
    setAnnualRatePercent,
    inflationMethod,
    setInflationMethod,
  } = useDebtCalculationContext()

  const { data: domains = [] } = useGetDomainsQuery({ archived: false })
  // An address holds many companies: narrowing by it first makes the company
  // list short. A filter only - nothing on the page depends on it.
  const [streetId, setStreetId] = useState<string | undefined>()

  const domainName = useMemo(
    () => domains.find(({ _id }) => String(_id) === domainId)?.name,
    [domains, domainId]
  )
  const { exportExcel, isExporting } = useExportExcel(domainName)

  const domainOptions = useMemo(() => {
    const allowed = new Set(allowedDomainIds)

    return domains
      .filter(({ _id }) => allowed.has(String(_id)))
      .map(({ _id, name }) => ({ value: String(_id), label: name }))
  }, [domains, allowedDomainIds])

  const streetOptions = useMemo(() => {
    const byStreet = new Map<string, { label: string; count: number }>()
    for (const { street } of companies) {
      const key = streetKey(street)
      const entry = byStreet.get(key) ?? {
        label:
          key === NO_STREET
            ? 'Без адреси'
            : `${street.address}${street.city ? ` (м. ${street.city})` : ''}`,
        count: 0,
      }
      entry.count += 1
      byStreet.set(key, entry)
    }
    return [...byStreet]
      .map(([value, { label, count }]) => ({
        value,
        label: `${label} — ${count}`,
        sortKey: label,
      }))
      .sort((a, b) =>
        a.value === NO_STREET
          ? 1
          : b.value === NO_STREET
            ? -1
            : a.sortKey.localeCompare(b.sortKey, 'uk', { numeric: true })
      )
      .map(({ value, label }) => ({ value, label }))
  }, [companies])

  const companyOptions = useMemo(
    () =>
      companies
        .filter(({ street }) => !streetId || streetKey(street) === streetId)
        .map(({ _id, companyName }) => ({
          value: _id,
          label: companyName,
        })),
    [companies, streetId]
  )

  const changeStreet = (value?: string): void => {
    setStreetId(value)
    const current = companies.find(({ _id }) => _id === companyId)
    if (value && current && streetKey(current.street) !== value) {
      setCompanyId(undefined)
    }
  }

  return (
    <div className={s.Header}>
      <div className={s.TitleRow}>
        <Typography.Title level={5} className={s.Title}>
          Розрахунок заборгованості
        </Typography.Title>

        <Space>
          <CreatePayments />
          <Button
            icon={<FileExcelOutlined />}
            loading={isExporting}
            disabled={!companyId}
            onClick={exportExcel}
          >
            Експорт в Excel
          </Button>
          <PrintPreview domainName={domainName} disabled={!companyId} />
        </Space>
      </div>

      <Space wrap size="middle" className={s.Controls}>
        <label className={s.Field}>
          <span className={s.Label}>Домен</span>
          <Select
            value={domainId}
            onChange={(value) => {
              setDomainId(value)
              setStreetId(undefined)
              setCompanyId(undefined)
            }}
            options={domainOptions}
            aria-label="Домен"
            placeholder="Оберіть домен"
            className={s.Domain}
            showSearch
            optionFilterProp="label"
          />
        </label>

        <label className={s.Field}>
          <span className={s.Label}>Адреса</span>
          <Select
            value={streetId}
            onChange={changeStreet}
            options={streetOptions}
            aria-label="Адреса"
            placeholder="Усі адреси"
            className={s.Street}
            disabled={!domainId || streetOptions.length === 0}
            allowClear
            showSearch
            optionFilterProp="label"
          />
        </label>

        <label className={s.Field}>
          <span className={s.Label}>Компанія</span>
          <Select
            value={companyId}
            onChange={setCompanyId}
            options={companyOptions}
            aria-label="Компанія"
            placeholder="Оберіть компанію"
            className={s.Company}
            disabled={!domainId}
            showSearch
            optionFilterProp="label"
          />
        </label>

        <label className={s.Field}>
          <span className={s.Label}>Період з</span>
          <DatePicker.MonthPicker
            value={from}
            onChange={setFrom}
            aria-label="Період з"
            format="MMMM YYYY"
            placeholder="Початок"
          />
        </label>

        <label className={s.Field}>
          <span className={s.Label}>по</span>
          <DatePicker.MonthPicker
            value={to}
            onChange={setTo}
            aria-label="Період по"
            format="MMMM YYYY"
            placeholder="Кінець"
          />
        </label>

        <label className={s.Field}>
          <span className={s.Label}>
            Метод інфляційних{' '}
            <Tooltip title={METHOD_HINT}>
              <QuestionCircleOutlined />
            </Tooltip>
          </span>
          <Select
            value={inflationMethod}
            onChange={setInflationMethod}
            aria-label="Метод інфляційних"
            className={s.Method}
            options={[
              { value: 'monthly', label: 'Помісячний (ст. 625 ЦК)' },
              { value: 'balance', label: 'За залишком (як в Акті)' },
            ]}
          />
        </label>

        <label className={s.Field}>
          <span className={s.Label}>Річних, %</span>
          <InputNumber
            value={annualRatePercent}
            onChange={(value) => setAnnualRatePercent(Number(value) || 0)}
            aria-label="Річних, %"
            min={0}
            max={100}
            step={0.5}
          />
        </label>

        <div className={s.Field}>
          <span className={s.Label}>Виключення</span>
          <ExcludedPeriods />
        </div>
      </Space>
    </div>
  )
}

export default DebtCalculationHeader
