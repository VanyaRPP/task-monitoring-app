import { DeleteOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons'
import { Alert, Button, Popconfirm, Table, message } from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useRouter } from 'next/router'

import { usePermissions } from '@utils/helpers'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'

import {
  useDeleteStreetMutation,
  useGetAllStreetsQuery,
} from '@common/api/streetApi/street.api'
import { IStreet } from '@common/api/streetApi/street.api.types'
import AddStreetModal from '@components/AddStreetModal'
import RealEstateBlock from '@components/DashboardPage/blocks/realEstates'
import { AppRoutes } from '@utils/constants'
import { useEffect, useState } from 'react'
import RealEstateForm from '@components/UI/RealEstateComponents/RealEstateModal/RealEstateForm'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@common/modules/store/store'
import { setPage, setStreetsData } from '@common/modules/store/serviceSlice'

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
  sepDomainId?: string
}

const StreetsTable: React.FC<Props> = ({
  domainId,
  setCurrentStreet,
  setStreetActions,
  streetActions,
  currentStreet,
  sepDomainId,
}) => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.STREETS

	const dispatch = useDispatch()
	const { currentPage, pageSize, totalCount } = useSelector(
		(state: RootState) => state.streets
	)

  const { data, isLoading, isError } = useGetAllStreetsQuery({
    domainId: sepDomainId || domainId,
    page: currentPage,
		limit: pageSize,
  })

	useEffect(() => {
		if (data) {
			dispatch(setStreetsData({ data: data.data, totalCount: data.totalCount}))
		}
	}, [data, dispatch])

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

  const { data: userResponse } = useGetCurrentUserQuery()
  const userRoles = usePermissions(userResponse)

  const closeModal = () => setIsModalOpen(false)
  const openModal = (street, actions) => {
    setIsModalOpen(true),
      setStreetActions({ ...streetActions, ...actions }),
      setCurrentStreet(street)
  }

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <>
      <Table
        rowKey="_id"
				loading={isLoading}
				columns={getDefaultColumns(handleDelete, deleteLoading, openModal, userRoles)}
				expandable={
					domainId && {
						expandedRowRender: (street) => (
							<RealEstateBlock domainId={domainId} streetId={street._id} />
						),
					}
				}
				dataSource = {data?.data || []}
        pagination={{
						current: currentPage,
						pageSize: pageSize,
						total: data?.totalCount,
            hideOnSinglePage: false,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
						position: ['bottomCenter'],
						onChange: (newPage, newPageSize) => {
							dispatch(setPage({ page: newPage, pageSize: newPageSize }))
						},
          }
        }
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
  openModal?: (
    street: IStreet,
    actions: { preview: boolean; edit: boolean }
  ) => void,
  userRoles?: { isGlobalAdmin: boolean }
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
        onClick={() => openModal(street, { preview: true, edit: false })}
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
    render: (_, street: IStreet) =>
      userRoles?.isGlobalAdmin && (
        <Button
          style={{ padding: 0 }}
          type="link"
          onClick={() => openModal(street, { preview: false, edit: true })}
        >
          <EditOutlined />
        </Button>
      ),
  },
  {
    align: 'center',
    fixed: 'right',
    title: '',
    width: 50,
    render: (_, street: IStreet) =>
      userRoles?.isGlobalAdmin && (
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
