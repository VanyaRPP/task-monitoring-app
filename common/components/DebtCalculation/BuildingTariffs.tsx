import {
  CloseOutlined,
  FilePdfOutlined,
  PlusOutlined,
  TableOutlined,
} from '@ant-design/icons'
import {
  useReadTariffsPdfMutation,
  useSaveBuildingTariffsMutation,
} from '@common/api/debtCalculationApi/debtCalculation.api'
import {
  apartmentOf,
  IBuildingTariffs,
  ITariffPeriod,
  tariffsOfStreet,
  tariffWarnings,
} from '@utils/debt-calculation/building-tariffs'
import {
  Alert,
  Button,
  DatePicker,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
  Upload,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import { useDebtCalculationContext } from './'
import { NO_STREET } from './Header'
import s from './style.module.scss'

const ISO = 'YYYY-MM-DD'
/** Under the API's body limit once base64 adds its third. */
const MAX_PDF_BYTES = 2.9 * 1024 * 1024

const EMPTY: IBuildingTariffs = {
  groups: [{ label: '', apartments: '' }],
  periods: [],
}

const groupName = (label: string, at: number): string =>
  label || `Група ${at + 1}`

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

/**
 * «Тарифи»: the tariffs of the domain's buildings, one table per address,
 * the way the management company prints them - periods down, a tariff per
 * group of apartments across. Filled by hand or from that very PDF; every
 * company of the building then takes its column, by its apartment number.
 */
const BuildingTariffs: React.FC = () => {
  const {
    domainId,
    companies,
    company,
    buildingTariffs,
    tariffGroup,
    overrides,
    setApartmentOverride,
  } = useDebtCalculationContext()
  const [readPdf, { isLoading: isReading }] = useReadTariffsPdfMutation()
  const [saveTariffs, { isLoading: isSaving }] =
    useSaveBuildingTariffsMutation()

  const [open, setOpen] = useState(false)
  const [street, setStreet] = useState<string>(NO_STREET)
  const [draft, setDraft] = useState<IBuildingTariffs>(EMPTY)
  const [dirty, setDirty] = useState(false)
  const [readWarnings, setReadWarnings] = useState<string[]>([])

  // The buildings: the addresses of the domain's companies, and any address
  // that already has tariffs.
  const buildings = useMemo(() => {
    const byStreet = new Map<string, string>()
    for (const { street: own } of companies) {
      const key = own?._id ?? NO_STREET
      if (!byStreet.has(key)) {
        byStreet.set(key, own?._id ? own.address : 'Без адреси')
      }
    }
    for (const entry of buildingTariffs) {
      const key = entry.street ?? NO_STREET
      if (!byStreet.has(key)) byStreet.set(key, entry.address ?? 'Без адреси')
    }
    return [...byStreet]
      .map(([value, label]) => ({
        value,
        label: buildingTariffs.some(
          (entry) => (entry.street ?? NO_STREET) === value
        )
          ? `${label} ✓`
          : label,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'uk', { numeric: true }))
  }, [companies, buildingTariffs])

  const savedOf = (key: string): IBuildingTariffs | undefined =>
    tariffsOfStreet(buildingTariffs, key === NO_STREET ? undefined : key)

  const load = (key: string): void => {
    setStreet(key)
    setDraft(savedOf(key) ?? EMPTY)
    setDirty(false)
    setReadWarnings([])
  }

  const show = (): void => {
    load(company?.street?._id ?? buildings[0]?.value ?? NO_STREET)
    setOpen(true)
  }

  const edit = (next: IBuildingTariffs): void => {
    setDraft(next)
    setDirty(true)
  }

  const editPeriod = (index: number, patch: Partial<ITariffPeriod>): void =>
    edit({
      ...draft,
      periods: draft.periods.map((period, at) =>
        at === index ? { ...period, ...patch } : period
      ),
    })

  const addPeriod = (): void => {
    const last = draft.periods[draft.periods.length - 1]
    // The day after the last period, or a month after its start.
    const from = !last
      ? dayjs().startOf('month')
      : last.to
        ? dayjs(last.to).add(1, 'day')
        : dayjs(last.from).add(1, 'month').startOf('month')
    edit({
      ...draft,
      periods: [
        ...draft.periods,
        {
          from: from.format(ISO),
          tariffs: draft.groups.map((_, at) => last?.tariffs[at] ?? null),
        },
      ],
    })
  }

  const addGroup = (): void =>
    edit({
      groups: [...draft.groups, { label: '', apartments: '' }],
      periods: draft.periods.map((period) => ({
        ...period,
        tariffs: [...period.tariffs, null],
      })),
    })

  const removeGroup = (index: number): void =>
    edit({
      groups: draft.groups.filter((_, at) => at !== index),
      periods: draft.periods.map((period) => ({
        ...period,
        tariffs: period.tariffs.filter((_, at) => at !== index),
      })),
    })

  const importPdf = async (file: File): Promise<void> => {
    if (file.size > MAX_PDF_BYTES) {
      message.error('PDF завеликий: до 3 МБ')
      return
    }
    try {
      const read = await readPdf({
        domainId,
        file: await readAsDataUrl(file),
      }).unwrap()
      if (!read.tariffs) {
        setReadWarnings(read.warnings)
        return
      }
      const target = read.street ?? street
      const notes = [...read.warnings]
      if (read.tariffs.address && !read.street) {
        const label = buildings.find(({ value }) => value === street)?.label
        notes.unshift(
          `Адреси «${read.tariffs.address}» з PDF немає серед адрес надавача — тарифи підуть у «${label ?? 'обраний будинок'}». Якщо будинок інший, оберіть його вгорі до збереження.`
        )
      }
      setStreet(target)
      setDraft({ ...read.tariffs })
      setDirty(true)
      setReadWarnings(notes)
      message.success(
        `Прочитано періодів: ${read.tariffs.periods.length}. Перевірте й збережіть.`
      )
    } catch (error) {
      message.error(
        (error as { data?: { message?: string } })?.data?.message ??
          'Не вдалося прочитати PDF'
      )
    }
  }

  const save = async (periods = draft.periods): Promise<void> => {
    try {
      await saveTariffs({
        domainId,
        tariffs: {
          ...draft,
          periods,
          street: street === NO_STREET ? undefined : street,
        },
      }).unwrap()
      message.success(periods.length ? 'Тарифи збережено' : 'Тарифи прибрано')
      setOpen(false)
    } catch (error) {
      message.error(
        (error as { data?: { message?: string } })?.data?.message ??
          'Не вдалося зберегти тарифи'
      )
    }
  }

  const checks = useMemo(() => tariffWarnings(draft), [draft])

  // The company on screen, when it lives in the building being edited.
  const companyHere = !!company && (company.street?._id ?? NO_STREET) === street
  const apartment = apartmentOf(company?.companyName, company?.description)
  const hasOwnTariff =
    overrides.tariff !== undefined || !!overrides.changes?.tariff?.length

  const columns: ColumnsType<ITariffPeriod & { index: number }> = [
    {
      title: 'З',
      width: 150,
      render: (_, period) => (
        <DatePicker
          size="small"
          format="DD.MM.YYYY"
          value={dayjs(period.from)}
          allowClear={false}
          aria-label="Тариф діє з"
          onChange={(value: Dayjs | null) =>
            value && editPeriod(period.index, { from: value.format(ISO) })
          }
        />
      ),
    },
    {
      title: 'По',
      width: 150,
      render: (_, period) => (
        <DatePicker
          size="small"
          format="DD.MM.YYYY"
          placeholder="даний час"
          value={period.to ? dayjs(period.to) : null}
          aria-label="Тариф діє по"
          onChange={(value: Dayjs | null) =>
            editPeriod(period.index, { to: value?.format(ISO) })
          }
        />
      ),
    },
    ...draft.groups.map((group, at) => ({
      title: groupName(group.label, at),
      key: `group-${at}`,
      render: (_: unknown, period: ITariffPeriod & { index: number }) => (
        <InputNumber
          size="small"
          min={0}
          step={0.01}
          value={period.tariffs[at]}
          aria-label={`Тариф, ${groupName(group.label, at)}`}
          onChange={(value) =>
            editPeriod(period.index, {
              tariffs: period.tariffs.map((tariff, which) =>
                which === at ? (value == null ? null : Number(value)) : tariff
              ),
            })
          }
        />
      ),
    })),
    {
      width: 40,
      render: (_, period) => (
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          aria-label="Прибрати період"
          onClick={() =>
            edit({
              ...draft,
              periods: draft.periods.filter((_, at) => at !== period.index),
            })
          }
        />
      ),
    },
  ]

  return (
    <>
      <Button icon={<TableOutlined />} disabled={!domainId} onClick={show}>
        Тарифи
      </Button>
      <Modal
        open={open}
        title="Тарифи будинків"
        width={900}
        onCancel={() => setOpen(false)}
        destroyOnHidden
        footer={[
          savedOf(street) && (
            <Popconfirm
              key="remove"
              title="Прибрати всі тарифи цього будинку?"
              okText="Прибрати"
              cancelText="Ні"
              onConfirm={() => save([])}
            >
              <Button danger>Прибрати тарифи будинку</Button>
            </Popconfirm>
          ),
          <Button key="close" onClick={() => setOpen(false)}>
            Закрити
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={isSaving}
            disabled={!dirty}
            onClick={() => save()}
          >
            Зберегти
          </Button>,
        ]}
      >
        <div className={s.Tariffs}>
          <Space wrap>
            <Select
              value={street}
              options={buildings}
              onChange={load}
              className={s.TariffsBuilding}
              aria-label="Будинок"
            />
            <Upload
              accept="application/pdf,.pdf"
              showUploadList={false}
              beforeUpload={(file) => {
                importPdf(file)
                return false
              }}
            >
              <Button icon={<FilePdfOutlined />} loading={isReading}>
                Імпорт з PDF
              </Button>
            </Upload>
          </Space>

          {readWarnings.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message="Перевірте перед збереженням"
              description={
                <ul className={s.TariffsWarnings}>
                  {readWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              }
            />
          )}

          <div className={s.TariffsGroups}>
            <Typography.Text type="secondary">
              Групи квартир — номери через «;», порожньо — решта квартир
            </Typography.Text>
            {draft.groups.map((group, at) => (
              <Space key={at} size="small">
                <Input
                  size="small"
                  value={group.label}
                  placeholder={`Група ${at + 1}`}
                  aria-label={`Назва групи ${at + 1}`}
                  className={s.TariffsLabel}
                  onChange={({ target }) =>
                    edit({
                      ...draft,
                      groups: draft.groups.map((other, which) =>
                        which === at ? { ...other, label: target.value } : other
                      ),
                    })
                  }
                />
                <Input
                  size="small"
                  value={group.apartments}
                  placeholder="решта квартир"
                  aria-label={`Квартири групи ${at + 1}`}
                  className={s.TariffsApartments}
                  onChange={({ target }) =>
                    edit({
                      ...draft,
                      groups: draft.groups.map((other, which) =>
                        which === at
                          ? { ...other, apartments: target.value }
                          : other
                      ),
                    })
                  }
                />
                {draft.groups.length > 1 && (
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    aria-label={`Прибрати групу ${at + 1}`}
                    onClick={() => removeGroup(at)}
                  />
                )}
              </Space>
            ))}
            <Button size="small" icon={<PlusOutlined />} onClick={addGroup}>
              Група
            </Button>
          </div>

          <Table
            size="small"
            bordered
            pagination={false}
            rowKey="index"
            columns={columns}
            dataSource={draft.periods.map((period, index) => ({
              ...period,
              index,
            }))}
            locale={{
              emptyText: 'Тарифів ще немає — імпортуйте PDF або додайте період',
            }}
          />
          <Button size="small" icon={<PlusOutlined />} onClick={addPeriod}>
            Період
          </Button>

          {checks.length > 0 && (
            <ul className={s.TariffsWarnings}>
              {checks.map((check) => (
                <li key={check}>
                  <Typography.Text type="secondary">{check}</Typography.Text>
                </li>
              ))}
            </ul>
          )}

          {companyHere && draft.groups.length > 1 && (
            <Space wrap className={s.TariffsCompany}>
              <Typography.Text>
                {company.companyName}
                {apartment === undefined ? '' : ` (кв. ${apartment})`} платить
                за
              </Typography.Text>
              <Select
                size="small"
                value={overrides.tariffGroup ?? 'auto'}
                className={s.TariffsLabel}
                aria-label="Група квартир компанії"
                onChange={(value) =>
                  setApartmentOverride({
                    tariffGroup: value === 'auto' ? undefined : Number(value),
                  })
                }
                options={[
                  {
                    value: 'auto',
                    label:
                      tariffGroup === undefined || dirty
                        ? 'за номером квартири'
                        : `за номером: ${groupName(draft.groups[tariffGroup]?.label ?? '', tariffGroup)}`,
                  },
                  ...draft.groups.map((group, at) => ({
                    value: at,
                    label: groupName(group.label, at),
                  })),
                ]}
              />
            </Space>
          )}

          {companyHere && hasOwnTariff && (
            <Alert
              type="info"
              showIcon
              message="У цієї компанії свій тариф — він має перевагу над тарифами будинку."
              action={
                <Button
                  size="small"
                  onClick={() =>
                    setApartmentOverride({
                      tariff: undefined,
                      changes: { ...overrides.changes, tariff: undefined },
                    })
                  }
                >
                  Брати тарифи будинку
                </Button>
              }
            />
          )}
        </div>
      </Modal>
    </>
  )
}

export default BuildingTariffs
