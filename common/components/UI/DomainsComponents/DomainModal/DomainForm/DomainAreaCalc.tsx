import React, { useMemo, useEffect, useCallback, useRef } from 'react'
import {
  Card,
  Table,
  InputNumber,
  Spin,
  Form,
  Empty,
  Tooltip,
  Button,
  Collapse,
  Tag,
  message,
} from 'antd'
import {
  ReloadOutlined,
  CalculatorOutlined,
  CheckOutlined,
  CloseOutlined,
  UndoOutlined,
  RollbackOutlined,
} from '@ant-design/icons'
import cn from 'classnames'
import { useGetAreasQuery } from '@common/api/domainApi/domain.api'
import ChartComponent from '@components/Chart'
import s from './style.module.scss'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import {
  AreaCalcRow,
  excludeCompany,
  getActiveRows,
  getCompanyState,
  getTotalArea,
  getTotalRentPart,
  hasRecalculationChanges,
  includeCompany,
  pinCompanyArea,
  recalculateAreaShares,
  unpinCompanyArea,
} from './areaRecalc'

interface Props {
  domainId?: string
  editable: boolean
  form: any
  setIsValueChanged?: (value: boolean) => void
}

const AreaCalculationCard: React.FC<Props> = ({
  domainId,
  editable,
  form,
  setIsValueChanged,
}) => {
  const {
    data: areasData,
    isLoading,
    isFetching,
    refetch,
  } = useGetAreasQuery(
    { domainId },
    { skip: !domainId, refetchOnMountOrArgChange: true }
  )

  const { data: allRealEstate } = useGetAllRealEstateQuery(
    { domainId },
    { skip: !domainId }
  )

  const watchedCompanies = Form.useWatch('companiesAreas', form)
  const showTable = Form.useWatch('showAreaDetails', form)

  const formCompanies = useMemo(
    () => watchedCompanies || [],
    [watchedCompanies]
  )
  const hasPlacementService = formCompanies.length > 0

  const activeCompanies = useMemo(
    () => getActiveRows(formCompanies),
    [formCompanies]
  )
  const totalRentWeight = useMemo(() => {
    return getTotalRentPart(activeCompanies)
  }, [activeCompanies])

  const currentTotalArea = useMemo(() => {
    return getTotalArea(activeCompanies)
  }, [activeCompanies])

  const totalAreaOfAllRows = useMemo(
    () => getTotalArea(formCompanies),
    [formCompanies]
  )

  const dataSource = useMemo(() => {
    return formCompanies.map((c: any) => ({
      ...c,
      percent: (Number(c.rentPart) || 0).toFixed(2),
    }))
  }, [formCompanies])

  const chartCacheRef = useRef<{ signature: string; data: any[] }>({
    signature: '',
    data: [],
  })

  const chartDataSources = useMemo(() => {
    const signature = activeCompanies
      .map((item: any) => `${item.name}:${Number(item.rentPart) || 0}`)
      .join('|')

    if (chartCacheRef.current.signature === signature) {
      return chartCacheRef.current.data
    }

    const data = activeCompanies.map((item: any) => {
      const percent =
        totalRentWeight > 0
          ? Number(((Number(item.rentPart) / totalRentWeight) * 100).toFixed(2))
          : 0
      return {
        label: item.name,
        value: {
          part: percent,
          area: Number(item.area) || 0,
        },
      }
    })

    chartCacheRef.current = { signature, data }
    return data
  }, [activeCompanies, totalRentWeight])

  useEffect(() => {
    if (domainId) {
      refetch()
    }
  }, [domainId, refetch])

  useEffect(() => {
    if (areasData?.companies && !isFetching && !isLoading) {
      const freshData = areasData.companies.map((c: any) => {
        const original = allRealEstate?.data?.find(
          (item: any) => item.companyName === c.companyName
        )
        return {
          _id: original?._id || c._id,
          name: c.companyName,
          area: c.totalArea,
          rentPart: c.rentPart,
          key: original?._id || c.companyName,
          _initialArea: c.totalArea,
          _initialRentPart: c.rentPart,
          _excluded: false,
          _pinned: false,
        }
      })
      form.setFieldsValue({ companiesAreas: freshData })
    }
  }, [areasData, isFetching, isLoading, allRealEstate, form])

  const handleUpdate = (index: number, changedFields: { area?: number }) => {
    const updatedCompanies = [...formCompanies]
    const newArea =
      changedFields.area !== undefined
        ? changedFields.area
        : updatedCompanies[index].area

    const finalData = updatedCompanies.map((c: any, i: number) =>
      i === index ? { ...c, area: newArea } : c
    )

    form.setFieldValue('companiesAreas', finalData)

    if (setIsValueChanged) {
      setIsValueChanged(true)
    }
  }

  const areaSources = useMemo(
    () => ({
      realEstates: allRealEstate?.data,
      companies: areasData?.companies,
    }),
    [allRealEstate, areasData]
  )

  const handleRecalculate = useCallback(() => {
    if (!formCompanies.length) return

    const recalculated = recalculateAreaShares(formCompanies, areaSources)

    form.setFieldValue('companiesAreas', recalculated)

    if (
      setIsValueChanged &&
      hasRecalculationChanges(formCompanies, recalculated)
    ) {
      setIsValueChanged(true)
    }

    message.success(
      `Частки перераховано за актуальними даними компаній. Загальна площа: ${getTotalArea(
        getActiveRows(recalculated)
      ).toFixed(2)} м²`
    )
  }, [formCompanies, areaSources, form, setIsValueChanged])

  const applyRowAction = useCallback(
    (next: AreaCalcRow[]) => {
      form.setFieldValue('companiesAreas', next)

      if (setIsValueChanged) {
        setIsValueChanged(true)
      }
    },
    [form, setIsValueChanged]
  )

  const handleExclude = useCallback(
    (index: number) => applyRowAction(excludeCompany(formCompanies, index)),
    [applyRowAction, formCompanies]
  )

  const handleInclude = useCallback(
    (index: number) => applyRowAction(includeCompany(formCompanies, index)),
    [applyRowAction, formCompanies]
  )

  const handlePin = useCallback(
    (index: number) => {
      applyRowAction(pinCompanyArea(formCompanies, index))
      message.success('Значення площі зафіксовано')
    },
    [applyRowAction, formCompanies]
  )

  const handleUnpin = useCallback(
    (index: number) =>
      applyRowAction(unpinCompanyArea(formCompanies, index, areaSources)),
    [applyRowAction, formCompanies, areaSources]
  )

  const columns = [
    {
      title: 'Назва компанії',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: AreaCalcRow) => {
        const state = getCompanyState(record)
        return (
          <div className={s.companyCell}>
            <span className={state === 'excluded' ? s.excludedName : undefined}>
              {name}
            </span>
            {state === 'excluded' && <Tag>Виключено з розрахунку</Tag>}
            {state === 'pinned' && <Tag color="green">Зафіксовано</Tag>}
          </div>
        )
      },
    },
    {
      title: 'Площа (м²)',
      dataIndex: 'area',
      key: 'area',
      render: (value: number, record: AreaCalcRow, index: number) => (
        <InputNumber
          min={0}
          value={value}
          disabled={!editable || getCompanyState(record) === 'excluded'}
          className={cn(s.fullWidth, {
            [s.pinnedArea]: getCompanyState(record) === 'pinned',
          })}
          addonAfter="м²"
          precision={2}
          onChange={(val) => handleUpdate(index, { area: val || 0 })}
        />
      ),
    },
    {
      title: 'Частка (%)',
      dataIndex: 'percent',
      key: 'percent',
      render: (percent: string, record: AreaCalcRow) =>
        getCompanyState(record) === 'excluded' ? (
          <span className={s.excludedPercent}>—</span>
        ) : (
          <b>{percent} %</b>
        ),
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 110,
      render: (_: unknown, record: AreaCalcRow, index: number) =>
        getCompanyState(record) === 'excluded' ? (
          <div className={s.rowActions}>
            <Tooltip title="Повернути в розрахунок">
              <Button
                data-testid={`include-company-${index}`}
                aria-label="Повернути в розрахунок"
                type="text"
                shape="circle"
                size="small"
                icon={<RollbackOutlined />}
                disabled={!editable}
                onClick={() => handleInclude(index)}
              />
            </Tooltip>
          </div>
        ) : (
          <div className={s.rowActions}>
            <Tooltip title="Зафіксувати значення">
              <Button
                data-testid={`pin-area-${index}`}
                aria-label="Зафіксувати значення"
                type="text"
                shape="circle"
                size="small"
                icon={<CheckOutlined />}
                disabled={!editable}
                onClick={() => handlePin(index)}
              />
            </Tooltip>
            {getCompanyState(record) === 'pinned' && (
              <Tooltip title="Скасувати фіксацію">
                <Button
                  data-testid={`unpin-area-${index}`}
                  aria-label="Скасувати фіксацію"
                  type="text"
                  shape="circle"
                  size="small"
                  icon={<UndoOutlined />}
                  disabled={!editable}
                  onClick={() => handleUnpin(index)}
                />
              </Tooltip>
            )}
            <Tooltip title="Виключити з розрахунку">
              <Button
                data-testid={`exclude-company-${index}`}
                aria-label="Виключити з розрахунку"
                type="text"
                shape="circle"
                size="small"
                icon={<CloseOutlined />}
                disabled={!editable}
                onClick={() => handleExclude(index)}
              />
            </Tooltip>
          </div>
        ),
    },
  ]

  if (!domainId) return null

  return (
    <div className={s.wrapper}>
      <Form.Item name="companiesAreas" hidden noStyle>
        <div />
      </Form.Item>
      <Form.Item name="showAreaDetails" hidden noStyle>
        <div />
      </Form.Item>

      <Card size="small" className={s.card} title={null}>
        <Collapse
          ghost
          activeKey={showTable ? ['1'] : []}
          onChange={(keys) =>
            form.setFieldValue('showAreaDetails', keys.length > 0)
          }
          items={[
            {
              key: '1',
              forceRender: true,
              label: (
                <div className={s.header}>
                  <span className={s.title}>Розрахунок площі по компаніях</span>
                  <div className={s.headerActions}>
                    <Tooltip title="Перерахувати частки за актуальними площами компаній">
                      <Button
                        data-testid="recalculate-button"
                        size="small"
                        icon={<CalculatorOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRecalculate()
                        }}
                        disabled={
                          !editable ||
                          isLoading ||
                          isFetching ||
                          !hasPlacementService
                        }
                      >
                        Перерахувати частки
                      </Button>
                    </Tooltip>
                    <Tooltip title="Оновити дані (скинути зміни)">
                      <Button
                        data-testid="reload-button"
                        type="text"
                        shape="circle"
                        icon={<ReloadOutlined spin={isFetching} />}
                        onClick={(e) => {
                          e.stopPropagation()
                          form.setFieldValue('companiesAreas', [])

                          if (setIsValueChanged) {
                            setIsValueChanged(false)
                          }
                          refetch()
                        }}
                        disabled={isLoading || isFetching}
                      />
                    </Tooltip>
                  </div>
                </div>
              ),
              children: (
                <div className={s.content}>
                  {isLoading || isFetching ? (
                    <div className={s.center}>
                      <Spin size="large" />
                    </div>
                  ) : hasPlacementService && totalAreaOfAllRows > 0 ? (
                    <>
                      <Table
                        dataSource={dataSource}
                        columns={columns}
                        pagination={false}
                        size="small"
                        bordered
                        rowClassName={(record: AreaCalcRow) =>
                          getCompanyState(record) === 'excluded'
                            ? s.excludedRow
                            : ''
                        }
                        summary={() => (
                          <Table.Summary.Row>
                            <Table.Summary.Cell index={0}>
                              <b>Всього</b>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1}>
                              <b>{currentTotalArea.toFixed(2)} м²</b>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2}>
                              <b>{totalRentWeight.toFixed(2)}%</b>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={3} />
                          </Table.Summary.Row>
                        )}
                      />
                      <div className={s.chart}>
                        <ChartComponent
                          dataSources={chartDataSources}
                          chartTitle="Розподіл площ"
                          domainName="Загальна площа"
                        />
                      </div>
                    </>
                  ) : (
                    <div className={s.empty}>
                      <Empty
                        description={
                          !hasPlacementService
                            ? 'Дані відсутні'
                            : 'Усі площі дорівнюють нулю'
                        }
                      />
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default AreaCalculationCard
