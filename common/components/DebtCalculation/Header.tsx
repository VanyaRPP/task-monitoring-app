import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import {
  DeleteOutlined,
  FileExcelOutlined,
  QuestionCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import {
  Button,
  DatePicker,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Tag,
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
    from,
    to,
    setFrom,
    setTo,
    annualRatePercent,
    setAnnualRatePercent,
    inflationMethod,
    setInflationMethod,
    savedCalculations,
    currentId,
    name,
    setName,
    isDirty,
    isSaving,
    save,
    load,
    remove,
    reset,
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

  return (
    <div className={s.Header}>
      <Space align="center" wrap>
        <Typography.Title level={5} className={s.Title}>
          Розрахунок заборгованості
        </Typography.Title>
        {isDirty && <Tag color="orange">Незбережені зміни</Tag>}
      </Space>

      <Space wrap size="middle" className={s.Controls}>
        <label className={s.Field}>
          <span className={s.Label}>Домен</span>
          <Select
            value={domainId}
            onChange={setDomainId}
            options={domainOptions}
            placeholder="Оберіть домен"
            className={s.Domain}
            showSearch
            optionFilterProp="label"
          />
        </label>

        <label className={s.Field}>
          <span className={s.Label}>Період з</span>
          <DatePicker.MonthPicker
            value={from}
            onChange={setFrom}
            format="MMMM YYYY"
            placeholder="Початок"
          />
        </label>

        <label className={s.Field}>
          <span className={s.Label}>по</span>
          <DatePicker.MonthPicker
            value={to}
            onChange={setTo}
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
            min={0}
            max={100}
            step={0.5}
          />
        </label>
      </Space>

      <Space wrap size="middle" className={s.Controls}>
        <label className={s.Field}>
          <span className={s.Label}>Збережені</span>
          <Select
            value={currentId}
            onChange={load}
            options={savedCalculations.map(({ _id, name: title }) => ({
              value: _id,
              label: title,
            }))}
            placeholder="Відкрити збережений"
            className={s.Saved}
            disabled={!domainId}
            showSearch
            optionFilterProp="label"
          />
        </label>

        <label className={s.Field}>
          <span className={s.Label}>Назва розрахунку</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Напр. Крошенська 8, кв. 18"
            maxLength={200}
            className={s.Saved}
          />
        </label>

        {/* Не <label>: він має підписувати поле вводу, а не групу кнопок —
            інакше кнопки успадковують його текст як доступну назву. */}
        <div className={s.Field}>
          <span className={s.Label}>&nbsp;</span>
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={isSaving}
              disabled={!domainId}
              onClick={save}
            >
              {currentId ? 'Зберегти зміни' : 'Зберегти'}
            </Button>
            <Button onClick={reset} disabled={!currentId && !name}>
              Новий
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              loading={isExporting}
              disabled={!domainId}
              onClick={exportExcel}
            >
              Експорт в Excel
            </Button>
            {currentId && (
              <Popconfirm
                title="Видалити розрахунок?"
                description="Дію не можна скасувати."
                okText="Видалити"
                cancelText="Скасувати"
                onConfirm={remove}
              >
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        </div>
      </Space>
    </div>
  )
}

export default DebtCalculationHeader
