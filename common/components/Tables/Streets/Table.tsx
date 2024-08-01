import { DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { Alert, Button, Popconfirm, Table, message } from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useRouter } from 'next/router'

import {
  useDeleteStreetMutation,
  useGetAllStreetsQuery,
} from '@common/api/streetApi/street.api'
import { IStreet } from '@common/api/streetApi/street.api.types'
import AddStreetModal from '@components/AddStreetModal'
import RealEstateBlock from '@components/DashboardPage/blocks/realEstates'
import { AppRoutes } from '@utils/constants'
import { useState } from 'react'

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
  setCurrentStreet: (street: IStreet) => void
  currentStreet?: IStreet
}

const StreetsTable: React.FC<Props> = ({
  domainId,
  setCurrentStreet,
  setStreetActions,
  streetActions,
  currentStreet,
}) => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.STREETS

  const { data, isLoading, isError } = useGetAllStreetsQuery({
    domainId,
    limit: isOnPage ? 0 : 5,
  })

  const [deleteStreet, { isLoading: deleteLoading }] = useDeleteStreetMutation()

  const handleDelete = async (id: string) => {
    const response = await deleteStreet(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні')
    }
  }

  const [isModalOpen, setIsModalOpen] = useState(false)

  const closeModal = () => setIsModalOpen(false)
  const openModal = (street) => {
    setIsModalOpen(true),
      setStreetActions({ ...streetActions, preview: true, edit: false }),
      setCurrentStreet(street)
  }

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <>
      <Table
        rowKey="_id"
        size="small"
        pagination={false}
        loading={isLoading}
        columns={getDefaultColumns(handleDelete, deleteLoading, openModal)}
        expandable={
          domainId && {
            expandedRowRender: (street) => (
              <RealEstateBlock domainId={domainId} streetId={street._id} />
            ),
          }
        }
        dataSource={data}
        scroll={{ x: 500 }}
      />
      {isModalOpen && (
        <AddStreetModal
          closeModal={closeModal}
          streetActions={streetActions}
          currentStreet={currentStreet}
        />
      )}
    </>
  )
}

const getDefaultColumns = (
  handleDelete?: (streetId: string) => void,
  deleteLoading?: boolean,
  openModal?: (street: IStreet) => void
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
    render: (_, street: IStreet) => (
      <Button
        style={{ padding: 0 }}
        type="link"
        onClick={() => openModal(street)}
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
