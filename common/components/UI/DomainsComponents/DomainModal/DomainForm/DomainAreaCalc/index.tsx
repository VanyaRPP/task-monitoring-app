import React, { useMemo, useEffect } from 'react'
import { Card, Table, InputNumber, Spin, Form, Empty, Tooltip, Button, Collapse } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useGetAreasQuery } from '@common/api/domainApi/domain.api'
import ChartComponent from '@components/Chart'
import s from '../style.module.scss'

interface Props {
  domainId?: string
  editable: boolean
  form: any
}

const AreaCalculationCard: React.FC<Props> = ({ domainId, editable, form }) => {
  const { data: areasData, isLoading, isFetching, refetch } = useGetAreasQuery(
    { domainId },
    { skip: !domainId }
  )

  const watchedCompanies = Form.useWatch('companiesAreas', form)
  const showTable = Form.useWatch('showAreaDetails', form)

  const formCompanies = useMemo(() => watchedCompanies || [], [watchedCompanies])
  const hasPlacementService = formCompanies.length > 0

  const baseTotalArea = useMemo(() => {
    return areasData?.totalArea || formCompanies.reduce((acc: number, curr: any) => acc + (Number(curr.area) || 0), 0)
  }, [areasData, formCompanies])

  const currentTotalArea = useMemo(() => {
    return formCompanies.reduce((acc: number, curr: any) => acc + (Number(curr.area) || 0), 0)
  }, [formCompanies])

  const dataSource = useMemo(() => {
    return formCompanies.map((c: any) => {
      const calculatedPercent =
        baseTotalArea > 0 ? ((Number(c.area) / baseTotalArea) * 100).toFixed(2) : '0.00'

      return {
        ...c,
        displayPercent: c.userInputPercent !== undefined ? c.userInputPercent : calculatedPercent,
      }
    })
  }, [formCompanies, baseTotalArea])

  const chartDataSources = useMemo(() => {
    return formCompanies.map((item: any) => {
      const purePercent =
        currentTotalArea > 0
          ? Number(((Number(item.area) / currentTotalArea) * 100).toFixed(2))
          : 0

      return {
        label: item.name,
        value: {
          part: purePercent,
          area: Number(item.area) || 0,
        },
      }
    })
  }, [formCompanies, currentTotalArea])

  useEffect(() => {
    if (areasData?.companies && !isFetching) {
      const freshData = areasData.companies.map((c: any) => ({
        name: c.companyName,
        area: c.totalArea,
        rentPart: c.rentPart,
        key: c.companyName,
      }))

      form.setFieldValue('companiesAreas', freshData)
    }
  }, [areasData, isFetching, form])

  const [canShowChart, setCanShowChart] = React.useState(false);

  useEffect(() => {
    if (showTable) {
      const timer = setTimeout(() => setCanShowChart(true), 300);
      return () => clearTimeout(timer);
    } else {
      setCanShowChart(false);
    }
  }, [showTable]);

  const columns = [
    { title: 'Назва компанії', dataIndex: 'name', key: 'name' },
    {
      title: 'Площа (м²)',
      dataIndex: 'area',
      key: 'area',
      render: (value: number, record: any, index: number) => (
        <InputNumber
          min={0}
          value={value}
          disabled={!editable}
          className={s.fullWidth}
          addonAfter="м²"
          precision={2}
          onChange={(newVal) => {
            const updated = [...formCompanies]
            updated[index] = {
              ...updated[index],
              area: newVal || 0,
              userInputPercent: undefined,
            }
            form.setFieldValue('companiesAreas', updated)
          }}
        />
      ),
    },
    {
      title: 'Частка (%)',
      dataIndex: 'displayPercent',
      key: 'percentage',
      render: (value: any, record: any, index: number) => (
        <InputNumber
          min={0}
          max={100}
          value={value}
          disabled={!editable || baseTotalArea === 0}
          className={s.fullWidth}
          addonAfter="%"
          precision={2}
          step={0.1}
          stringMode
          onChange={(newVal) => {
            const updated = [...formCompanies]
            updated[index] = { ...updated[index], userInputPercent: newVal }
            form.setFieldValue('companiesAreas', updated)
          }}
          onBlur={() => {
            const typedPercent = Number(record.userInputPercent)
            if (!isNaN(typedPercent)) {
              const totalBase = currentTotalArea
              if (totalBase > 0) {
                const newAreaForCurrent = (totalBase * typedPercent) / 100
                const remainingArea = totalBase - newAreaForCurrent

                const otherCompaniesTotalArea = formCompanies.reduce(
                  (acc: number, c: any, i: number) =>
                    i !== index ? acc + (Number(c.area) || 0) : acc,
                  0
                )

                const updated = formCompanies.map((c: any, i: number) => {
                  if (i === index) {
                    return {
                      ...c,
                      area: Number(newAreaForCurrent.toFixed(2)),
                      userInputPercent: undefined,
                    }
                  }

                  let newOtherArea = 0
                  if (otherCompaniesTotalArea > 0) {
                    newOtherArea = (c.area / otherCompaniesTotalArea) * remainingArea
                  } else if (remainingArea > 0) {
                    newOtherArea = remainingArea / (formCompanies.length - 1)
                  }

                  return {
                    ...c,
                    area: Number(newOtherArea.toFixed(2)),
                    userInputPercent: undefined,
                  }
                })

                form.setFieldValue('companiesAreas', updated)
              }
            }
          }}
          onPressEnter={(e: any) => e.target.blur()}
        />
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
          onChange={(keys) => {
            form.setFieldValue('showAreaDetails', keys.length > 0)
          }}
          items={[
            {
              key: '1',
              forceRender: true,
              label: (
                <div className={s.header}>
                  <span className={s.title}>
                    Розрахунок площі по компаніях
                  </span>

                  <Tooltip title="Оновити дані">
                    <Button
                      type="text"
                      shape="circle"
                      icon={<ReloadOutlined spin={isFetching} />}
                      onClick={(e) => {
                        e.stopPropagation()
                        refetch()
                      }}
                      disabled={isLoading || isFetching}
                    />
                  </Tooltip>
                </div>
              ),
              children: (
                <div className={s.content}>
                  {isLoading || isFetching ? (
                    <div className={s.center}>
                      <Spin size="large" />
                    </div>
                  ) : hasPlacementService ? (
                    currentTotalArea > 0 ? (
                      <>
                        <Table
                          dataSource={dataSource}
                          columns={columns}
                          pagination={false}
                          size="small"
                          bordered
                          summary={() => (
                            <Table.Summary.Row>
                              <Table.Summary.Cell index={0}>
                                <b>Всього</b>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={1}>
                                <b>{currentTotalArea.toFixed(2)} м²</b>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={2}>
                                <b>100%</b>
                              </Table.Summary.Cell>
                            </Table.Summary.Row>
                          )}
                        />
                        {canShowChart && (
                        <div className={s.chart}>
                          <ChartComponent
                            dataSources={chartDataSources}
                            chartTitle="Розподіл площ"
                            domainName="Загальна площа"
                          />
                        </div>
                      )}
                      </>
                    ) : (
                      <div className={s.empty}>
                        <Empty description="Усі площі дорівнюють нулю" />
                      </div>
                    )
                  ) : (
                    <div className={s.noData}>Дані відсутні</div>
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