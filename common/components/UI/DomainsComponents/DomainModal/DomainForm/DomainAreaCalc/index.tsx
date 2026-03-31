import React, { useMemo, useEffect } from 'react'
import { Card, Table, InputNumber, Spin, Form, Empty, Tooltip, Button, Collapse } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useGetAreasQuery } from '@common/api/domainApi/domain.api'
import ChartComponent from '@components/Chart'
import s from '../style.module.scss'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'

interface Props {
  domainId?: string
  editable: boolean
  form: any
  setIsValueChanged?: (value: boolean) => void
}

const AreaCalculationCard: React.FC<Props> = ({ domainId, editable, form, setIsValueChanged}) => {
  const { data: areasData, isLoading, isFetching, refetch } = useGetAreasQuery(
    { domainId },
    { skip: !domainId, refetchOnMountOrArgChange: true }
  )

  const { data: allRealEstate } = useGetAllRealEstateQuery({});

  const watchedCompanies = Form.useWatch('companiesAreas', form)
  const showTable = Form.useWatch('showAreaDetails', form)

  const formCompanies = useMemo(() => watchedCompanies || [], [watchedCompanies])
  const hasPlacementService = formCompanies.length > 0

  const totalRentWeight = useMemo(() => {
    return formCompanies.reduce((acc: number, curr: any) => acc + (Number(curr.rentPart) || 0), 0)
  }, [formCompanies])

  const currentTotalArea = useMemo(() => {
    return formCompanies.reduce((acc: number, curr: any) => acc + (Number(curr.area) || 0), 0)
  }, [formCompanies])

  const dataSource = useMemo(() => {
    return formCompanies.map((c: any) => {
      const percent =
        currentTotalArea > 0
          ? ((Number(c.area) / currentTotalArea) * 100).toFixed(2)
          : '0.00'
      return { ...c, percent }
    })
  }, [formCompanies, currentTotalArea])

  const chartDataSources = useMemo(() => {
    return formCompanies.map((item: any) => {
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
  }, [formCompanies, totalRentWeight])

  useEffect(() => {
    if (domainId) {
      refetch();
    }
  }, [domainId, refetch]);

  useEffect(() => {
    const currentValues = form.getFieldValue('companiesAreas');
    
    if (areasData?.companies && !isFetching) {
      if (!currentValues || currentValues.length === 0) {
        const freshData = areasData.companies.map((c: any) => {
          const original = allRealEstate?.data?.find((item: any) => item.companyName === c.companyName);
          
          return {
            _id: original?._id || c._id,
            name: c.companyName,
            area: c.totalArea,
            rentPart: c.rentPart,
            key: original?._id || c.companyName,
          };
        });

        form.setFieldValue('companiesAreas', freshData);
      }
    }
  }, [areasData, isFetching, allRealEstate, form]);

  const handleUpdate = (index: number, changedFields: { area?: number }) => {
    const updatedCompanies = [...formCompanies]
    const newArea = changedFields.area !== undefined ? changedFields.area : updatedCompanies[index].area
    
    const newTotalArea = updatedCompanies.reduce((acc: number, c: any, i: number) => {
      return acc + (i === index ? newArea : (Number(c.area) || 0))
    }, 0)

    const finalData = updatedCompanies.map((c: any, i: number) => {
      const area = i === index ? newArea : (Number(c.area) || 0)
      const rentPart = newTotalArea > 0 ? (area / newTotalArea) * 100 : 0
      return { ...c, area, rentPart }
    })

    form.setFieldValue('companiesAreas', finalData)

    if (setIsValueChanged) {
      setIsValueChanged(true)
    }
  }

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
          onChange={(val) => handleUpdate(index, { area: val || 0 })}
        />
      ),
    },
    {
      title: 'Частка (%)',
      dataIndex: 'percent',
      key: 'percent',
      render: (percent: string) => <b>{percent} %</b>,
    },
  ]

  if (!domainId) return null

  return (
    <div className={s.wrapper}>
      <Form.Item name="companiesAreas" hidden noStyle><div /></Form.Item>
      <Form.Item name="showAreaDetails" hidden noStyle><div /></Form.Item>

      <Card size="small" className={s.card} title={null}>
        <Collapse
          ghost
          activeKey={showTable ? ['1'] : []}
          onChange={(keys) => form.setFieldValue('showAreaDetails', keys.length > 0)}
          items={[
            {
              key: '1',
              forceRender: true,
              label: (
                <div className={s.header}>
                  <span className={s.title}>Розрахунок площі по компаніях</span>
                    <Tooltip title="Оновити дані (скинути зміни)">
                    <Button
                      type="text"
                      shape="circle"
                      icon={<ReloadOutlined spin={isFetching} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        form.setFieldValue('companiesAreas', []); 
                        
                        if (setIsValueChanged) {
                          setIsValueChanged(false);
                        }
                        refetch();
                      }}
                      disabled={isLoading || isFetching}
                    />
                  </Tooltip>
                </div>
              ),
              children: (
                <div className={s.content}>
                  {isLoading || isFetching ? (
                    <div className={s.center}><Spin size="large" /></div>
                  ) : hasPlacementService && currentTotalArea > 0 ? (
                    <>
                      <Table
                        dataSource={dataSource}
                        columns={columns}
                        pagination={false}
                        size="small"
                        bordered
                        summary={() => (
                          <Table.Summary.Row>
                            <Table.Summary.Cell index={0}><b>Всього</b></Table.Summary.Cell>
                            <Table.Summary.Cell index={1}><b>{currentTotalArea.toFixed(2)} м²</b></Table.Summary.Cell>
                            <Table.Summary.Cell index={2}><b>100%</b></Table.Summary.Cell>
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
                      <Empty description={!hasPlacementService ? "Дані відсутні" : "Усі площі дорівнюють нулю"} />
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