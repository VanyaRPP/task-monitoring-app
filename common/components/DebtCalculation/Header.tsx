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
import { useMemo } from 'react'
import { useDebtCalculationContext } from './'
import { useExportExcel } from './useExportExcel'
import s from './style.module.scss'

const METHOD_HINT =
  'За залишком — як у паперовому Акті ОСББ: сукупний коефіцієнт за весь ' +
  'період множиться на весь поточний залишок боргу. Помісячний — як вимагає ' +
  'ст. 625 ЦК: кожне нарахування індексується від свого місяця, оплати ' +
  'гасять найстаріший борг. Помісячний дає помітно меншу суму.'

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

  const companyOptions = useMemo(
    () =>
      companies.map(({ _id, companyName }) => ({
        value: _id,
        label: companyName,
      })),
    [companies]
  )

  return (
    <div className={s.Header}>
      <div className={s.TitleRow}>
        <Typography.Title level={5} className={s.Title}>
          Розрахунок заборгованості
        </Typography.Title>

        <Button
          icon={<FileExcelOutlined />}
          loading={isExporting}
          disabled={!companyId}
          onClick={exportExcel}
        >
          Експорт в Excel
        </Button>
      </div>

      <Space wrap size="middle" className={s.Controls}>
        <label className={s.Field}>
          <span className={s.Label}>Домен</span>
          <Select
            value={domainId}
            onChange={(value) => {
              setDomainId(value)
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
              { value: 'balance', label: 'За залишком (як в Акті)' },
              { value: 'monthly', label: 'Помісячний (ст. 625 ЦК)' },
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
      </Space>
    </div>
  )
}

export default DebtCalculationHeader
