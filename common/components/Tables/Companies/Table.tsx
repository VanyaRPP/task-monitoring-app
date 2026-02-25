import { useTableLogic } from '@common/modules/hooks/useTableLogic'
import { Alert, Switch, Table } from 'antd'
import React from 'react'
import { getDefaultColumns } from './Table.columns'
import { IExtendedRealestate, IGetRealestateResponse } from '@common/api/realestateApi/realestate.api.types'

export interface Props {
  domainId?: string
  streetId?: string
  setCurrentRealEstate?: (realEstate: IExtendedRealestate) => void
  realEstates: IGetRealestateResponse
  isLoading: boolean
  isError: boolean
  filters?: any
  setFilters?: (filters: any) => void
  setRealEstateActions: React.Dispatch<React.SetStateAction<{ edit: boolean }>>
  realEstateActions: { edit: boolean }
  isArchive: boolean
  customServices?: { _id: string; name: string }[]
}

const CompaniesTable: React.FC<Props> = (props) => {
  const { isError, isLoading, domainId, streetId, setFilters } = props

  const logic = useTableLogic(props)

  if (isError) return <Alert message="Помилка завантаження" type="error" showIcon closable />

  const tableWidth = 1800 + (logic.isGlobalAdmin ? 50 : 0) + (!domainId && !streetId && !isLoading ? 400 : 0)

  return (
    <Table
      rowKey="_id"
      loading={isLoading}
      dataSource={logic.dataSource}
      scroll={{ x: tableWidth }}
      columns={getDefaultColumns({ ...props, ...logic })}
      pagination={{
        hideOnSinglePage: false,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50],
        position: ['bottomCenter'],
        showTotal: () => !logic.isUser && (
          <Switch
            checkedChildren="Боржники"
            unCheckedChildren="Всі"
            onChange={(checked) => setFilters(checked ? { company: logic.debtorCompanies?.map((c: any) => c.companyId) } : undefined)}
          />
        ),
      }}
      onChange={(__, tableFilters) => {
        const newFilters: any = { domain: tableFilters?.domain, street: tableFilters?.street }
        if (!logic.isSingleCompanyByData) newFilters.company = tableFilters?.companyName
        setFilters(newFilters)
      }}
    />
  )
}

export default CompaniesTable