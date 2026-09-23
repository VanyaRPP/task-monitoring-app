import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import { Alert, Empty, InputNumber, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useDebtCalculationContext } from './'
import { formatMoney } from './format'
import MonthsTable from './MonthsTable'
import s from './style.module.scss'

const sumBy = (
  companies: IExtendedRealestate[],
  pick: (id: string) => number
): number => companies.reduce((acc, { _id }) => acc + (pick(_id) || 0), 0)

const DebtCalculationTable: React.FC = () => {
  const {
    domainId,
    companies,
    results,
    overrides,
    setApartmentOverride,
    missingIndexPeriods,
    isLoading,
  } = useDebtCalculationContext()

  if (!domainId) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Оберіть домен, щоб побачити квартири"
      />
    )
  }

  const editable = (
    companyId: string,
    field: 'area' | 'tariff' | 'openingDebt' | 'legalFees' | 'courtFee',
    placeholder: string
  ) => (
    <InputNumber
      size="small"
      min={0}
      value={overrides[companyId]?.[field]}
      placeholder={placeholder}
      onChange={(value) =>
        setApartmentOverride(companyId, {
          [field]: value == null ? undefined : Number(value),
        })
      }
    />
  )

  const columns: ColumnsType<IExtendedRealestate> = [
    {
      title: 'Квартира',
      width: 240,
      fixed: 'left',
      render: (_, company) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{company.companyName}</Typography.Text>
          {company.description && (
            <Typography.Text type="secondary" className={s.Muted}>
              {company.description}
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Площа, м²',
      width: 120,
      render: (_, { _id, totalArea }) =>
        editable(_id, 'area', String(totalArea ?? 0)),
    },
    {
      title: 'Тариф, грн/м²',
      width: 130,
      render: (_, { _id, pricePerMeter }) =>
        editable(_id, 'tariff', String(pricePerMeter ?? 0)),
    },
    {
      title: 'Борг на початок',
      width: 140,
      render: (_, { _id }) => editable(_id, 'openingDebt', '0.00'),
    },
    {
      title: 'Тіло боргу',
      width: 130,
      align: 'right',
      render: (_, { _id }) => formatMoney(results[_id]?.body),
    },
    {
      title: 'Річних',
      width: 120,
      align: 'right',
      render: (_, { _id }) => formatMoney(results[_id]?.interest),
    },
    {
      title: 'Інфляційні',
      width: 130,
      align: 'right',
      render: (_, { _id }) => formatMoney(results[_id]?.inflation),
    },
    {
      title: 'Юр. послуги',
      width: 130,
      render: (_, { _id }) => editable(_id, 'legalFees', '0.00'),
    },
    {
      title: 'Держмито',
      width: 130,
      render: (_, { _id }) => editable(_id, 'courtFee', '0.00'),
    },
    {
      title: 'Разом',
      width: 150,
      align: 'right',
      fixed: 'right',
      render: (_, { _id }) => (
        <strong className={s.Total}>{formatMoney(results[_id]?.total)}</strong>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {missingIndexPeriods.length > 0 && (
        <Alert
          showIcon
          type="warning"
          message="У довіднику немає індексу інфляції за деякі місяці періоду"
          description={`Ці місяці рахуються з індексом 100 (без зміни): ${missingIndexPeriods.join(', ')}. Впишіть значення вручну в помісячній таблиці або досійте довідник.`}
        />
      )}

      <Table<IExtendedRealestate>
        bordered
        loading={isLoading}
        pagination={false}
        scroll={{ x: 'max-content' }}
        rowKey="_id"
        columns={columns}
        dataSource={companies}
        expandable={{
          // Помісячна деталізація рендериться лише для розгорнутої квартири —
          // 44 місяці × кілька інпутів на кожну одразу були б задорого.
          expandedRowRender: (company) => (
            <MonthsTable
              companyId={company._id}
              result={results[company._id]}
            />
          ),
          rowExpandable: (company) => !!results[company._id]?.rows?.length,
        }}
        summary={(rows) => {
          const list = rows as IExtendedRealestate[]
          if (list.length === 0) return null

          return (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}>
                  <strong>Разом по {list.length} квартирах</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <strong>
                    {formatMoney(sumBy(list, (id) => results[id]?.body))}
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <strong>
                    {formatMoney(sumBy(list, (id) => results[id]?.interest))}
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  <strong>
                    {formatMoney(sumBy(list, (id) => results[id]?.inflation))}
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} colSpan={2} />
                <Table.Summary.Cell index={9} align="right">
                  <strong className={s.Total}>
                    {formatMoney(sumBy(list, (id) => results[id]?.total))}
                  </strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )
        }}
      />
    </Space>
  )
}

export default DebtCalculationTable
