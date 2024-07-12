import { DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { Alert, Button, Popconfirm, Table, message } from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useRouter } from 'next/router'

import {
  useDeleteStreetMutation,
  useGetAllStreetsQuery,
} from '@common/api/streetApi/street.api'

import { AppRoutes } from '@utils/constants'
import RealEstateBlock from '@common/components/DashboardPage/blocks/realEstates'
import {
  IGetStreetResponse,
  IStreet,
} from '@common/api/streetApi/street.api.types'
import { useEffect } from 'react'
import { IFilter } from '@common/api/paymentApi/payment.api.types'

export interface Props {
  domainId?: string
  setStreetActions: React.Dispatch<
    React.SetStateAction<{
      edit: boolean
      preview: boolean
    }>
  >
  streetActions: {
    edit: boolean
    preview: boolean
  }
  setCurrentStreet: (setvice: IStreet) => void
  streets: IGetStreetResponse
  isLoading?: boolean
  isError?: boolean
  filter?: any
  setFilter?: (filters: any) => void
}

const StreetsTable: React.FC<Props> = ({
  domainId,
  setCurrentStreet,
  setStreetActions,
  streetActions,
  streets,
  isLoading,
  isError,
  filter,
  setFilter,
}) => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.STREETS

  // useEffect(() => {
  //   if (streets?.length > 0) {
  //     console.log('Domains:', streets)
  //   } else {
  //     console.log('No domains found.')
  //   }
  // }, [streets])

  const [deleteStreet, { isLoading: deleteLoading }] = useDeleteStreetMutation()

  const handleDelete = async (id: string) => {
    const response = await deleteStreet(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні')
    }
  }

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <Table
      rowKey="_id"
      size="small"
      pagination={false}
      loading={isLoading}
      columns={getDefaultColumns(
        handleDelete,
        deleteLoading,
        setCurrentStreet,
        setStreetActions,
        streetActions,
        streets?.addressFilter,
        streets?.domainFilter
      )}
      expandable={
        domainId && {
          expandedRowRender: (street) => (
            <RealEstateBlock domainId={domainId} streetId={street._id} />
          ),
        }
      }
      dataSource={streets?.data}
      scroll={{ x: 500 }}
    />
  )
}

const getDefaultColumns = (
  handleDelete?: (streetId: string) => void,
  deleteLoading?: boolean,
  setCurrentStreet?: (street: IStreet) => void,
  setStreetActions?: React.Dispatch<
    React.SetStateAction<{
      edit: boolean
      preview: boolean
    }>
  >,
  streetActions?: {
    edit: boolean
    preview: boolean
  },
  addressFilter?: IFilter[],
  domainFilter?: IFilter[]
): ColumnType<any>[] => [
  {
    title: 'Місто',
    width: '25%',
    dataIndex: 'city',
  },
  {
    title: 'Вулиця',
    dataIndex: 'address',
  },
  {
    align: 'center',
    fixed: 'right',
    title: '',
    width: 50,
    render: (_, service: IStreet) => (
      <Button
        style={{ padding: 0 }}
        type="link"
        onClick={() => {
          setCurrentStreet(service)
          setStreetActions({ ...streetActions, preview: true })
        }}
      >
        <EyeOutlined />
      </Button>
    ),
  },
  {
    align: 'center',
    fixed: 'right',
    title: '',
    width: 50,
    render: (_, street: IStreet) => (
      <Popconfirm
        title={`Ви впевнені що хочете видалити вулицю ${street.address} (м. ${street.city})?`}
        onConfirm={() => handleDelete(street._id)}
        cancelText="Відміна"
        disabled={deleteLoading}
      >
        <DeleteOutlined />
      </Popconfirm>
    ),
  },
]

export default StreetsTable
