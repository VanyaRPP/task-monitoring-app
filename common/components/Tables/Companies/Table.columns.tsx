import { DeleteOutlined, EditOutlined, InboxOutlined, MoreOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import CollapsedTags from '@components/UI/CollapsedTags'
import { AppRoutes } from '@utils/constants'
import { formatDebt, getDebtorTooltipColor, renderCurrency } from '@utils/helpers'
import { Badge, Button, Checkbox, Dropdown, Popconfirm, Tooltip } from 'antd'
import { ColumnType } from 'antd/lib/table'
import React from 'react'
import s from './style.module.scss'
import { Props } from '@components/Tables/Companies/Table'

export const SERVICE_COLUMNS_CONFIG: Record<string, any> = {
  totalArea: { title: 'Площа (м²)', width: 120 },
  pricePerMeter: { title: 'Ціна (грн/м²)', width: 120, isPrice: true },
  servicePricePerMeter: { title: 'Індивідуальне утримання (грн/м²)', width: 200, isPrice: true },
  rentPart: { title: 'Частка загальної площі', width: 200 },
  waterPart: { title: 'Частка водопостачання', width: 180 },
  cleaning: { title: 'Прибирання (грн)', width: 150, isPrice: true },
  discount: { title: 'Знижка', width: 150, isPrice: true },
  garbageCollector: { title: 'Вивіз сміття', width: 150, isCheckbox: true },
  inflicion: { title: 'Нарахування інд. інф.', width: 170, isCheckbox: true },
}

export const getDefaultColumns = (args: Props & any): ColumnType<any>[] => {
  const {
    pathname, isAdmin, isGlobalAdmin, isUser, filters, customServices,
    setCurrentRealEstate, setRealEstateActions, debtorCompanies,
    isSingleCompanyByData, keysToRender = [], filtersData, handlers
  } = args

  const isOnPage = pathname === AppRoutes.REAL_ESTATE
  const resultColumns: ColumnType<any>[] = []

  if (!isSingleCompanyByData) {
    resultColumns.push({
      fixed: 'left', title: 'Назва компанії', dataIndex: 'companyName', key: 'companyName', width: 200,
      filters: (isAdmin && isOnPage) ? filtersData.realEstate?.realEstatesFilter : null,
      filteredValue: filters?.company || null,
      render: (name: string) => {
        const debtor = debtorCompanies?.find((c: any) => c.companyName === name)
        if (isUser || !debtor) return name
        return (
          <Badge count={formatDebt(debtor.totalDebt)} color={getDebtorTooltipColor(debtor)} size="small" offset={[3, -8]}>
            <Tooltip title="Компанія боржник"><span style={{ cursor: 'pointer', fontWeight: 500 }}>{name}</span></Tooltip>
          </Badge>
        )
      },
    })
  }

  resultColumns.push({
    title: 'Надавач послуг', dataIndex: 'domain', key: 'domain', width: 200,
    hidden: filtersData.domain?.domainsFilter?.length <= 1,
    filters: (isAdmin && isOnPage) ? filtersData.domain?.domainsFilter : null,
    filteredValue: filters?.domain || null,
    render: (i: any) => i?.name,
  })

  resultColumns.push({
    title: 'Адреса', dataIndex: 'street', key: 'street', width: 260,
    filters: (isAdmin && isOnPage) ? filtersData.street?.streetsFilter : null,
    filteredValue: filters?.street || null,
    render: (i: any) => i ? `${i.address} (м. ${i.city})` : '-',
  })

  const dynamicServiceColumns = keysToRender.map((key: string) => {
    const config = SERVICE_COLUMNS_CONFIG[key]
    if (config) {
      return {
        title: config.title, dataIndex: key, key, width: config.width, align: 'center',
        sorter: !config.isCheckbox && isOnPage ? (a: any, b: any) => a[key] - b[key] : null,
        render: (value: any) => {
          if (config.isCheckbox) return <Checkbox checked={value} disabled />
          if (config.isPrice) return value ? renderCurrency(value) : <span className={s.currency}>-</span>
          return value || '-'
        },
      }
    }

    const customSrv = customServices?.find((s: any) => s._id === key || s.fieldName === key)
    if (customSrv) {
      return {
        title: customSrv.name, key, width: 160, align: 'center',
        render: (_: any, record: IExtendedRealestate) => {
          const match = [...(record.services || []), ...(record.customServices || []), ...((record as any).individualServices || [])]
            .find((s) => String(s._id || s.serviceId) === String(customSrv._id))
          return match?.price ? renderCurrency(match.price) : <span className={s.currency}>-</span>
        },
      }
    }
    return null
  }).filter(Boolean)

  resultColumns.push({
    title: 'Адміністратори', dataIndex: 'adminEmails', width: 250,
    render: (emails) => <CollapsedTags items={emails} maxVisible={2} />,
  })

  resultColumns.push({
    title: 'Опис', dataIndex: 'description', width: 100, align: 'center',
    render: (text) => (
      <Tooltip title={(text ?? '').trim() || null} placement="top">
        <QuestionCircleOutlined />
      </Tooltip>
    ),
  })

   resultColumns.push(...dynamicServiceColumns)

  if (isAdmin) {
    resultColumns.push({
      fixed: 'right', align: 'center', title: '', width: 56,
      render: (_, record) => (
        <Button icon={<EditOutlined />} type="link" onClick={() => {
            setCurrentRealEstate(record)
            setRealEstateActions({ edit: true })
        }} />
      ),
    })

    resultColumns.push({
      align: 'center', fixed: 'right', title: '', width: 98,
      render: (_, record) => (
        <Dropdown menu={{
            items: [
              {
                key: 'archive',
                label: (
                  <Popconfirm title="Змінити статус?" onConfirm={() => handlers.handleArchive(record?._id, !record.archived)}>
                    <Button type="text" icon={<InboxOutlined />} style={{ color: record.archived ? '#722ed1' : '#ff4d4f', padding: '0 10px' }}>
                      {record.archived ? 'Розархівувати' : 'Архівувати'}
                    </Button>
                  </Popconfirm>
                ),
              },
              isGlobalAdmin && {
                key: 'delete',
                label: (
                  <Popconfirm title="Видалити?" onConfirm={() => handlers.handleDelete(record?._id)}>
                    <Button type="text" icon={<DeleteOutlined />} style={{ color: '#ff4d4f', padding: '0 10px' }}>Видалить</Button>
                  </Popconfirm>
                ),
              },
            ].filter(Boolean) as any,
          }}
          placement="bottomRight"
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    })
  }

  return resultColumns
}