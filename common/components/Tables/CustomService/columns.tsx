import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { Button, Input, Popconfirm } from 'antd'
import { ColumnType } from 'antd/lib/table'
import { ICustomService } from '@common/api/customServicesApi/customServices.api.types'

const ACCENT_COLOR = '#642AB5'

interface GetColumnsParams {
  editingKey: string | null
  tempName: string
  setTempName: (v: string) => void
  startEdit: (service: ICustomService) => void
  cancelEdit: () => void
  saveEdit: (service: ICustomService) => void
  remove: (id: string) => void
  isUpdating: boolean
  isDeleting: boolean
}

export const getColumns = ({
  editingKey,
  tempName,
  setTempName,
  startEdit,
  cancelEdit,
  saveEdit,
  remove,
  isUpdating,
  isDeleting,
}: GetColumnsParams): ColumnType<ICustomService>[] => [
  {
    title: 'Назва',
    dataIndex: 'name',
    render: (_, record) =>
      editingKey === record._id ? (
        <Input
          size="small"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onPressEnter={() => saveEdit(record)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') cancelEdit()
          }}
          autoFocus
        />
      ) : (
        record.name
      ),
  },
  {
    align: 'center',
    fixed: 'right',
    width: 100,
    render: (_, record) =>
      editingKey === record._id ? (
        <>
          <Button
            type="text"
            size="small"
            loading={isUpdating}
            icon={
              <CheckOutlined
                style={{
                  color: ACCENT_COLOR,
                  stroke: ACCENT_COLOR,
                  strokeWidth: 60,
                }}
              />
            }
            onClick={() => saveEdit(record)}
          />
          <Button
            type="text"
            size="small"
            disabled={isUpdating}
            icon={<CloseOutlined style={{ strokeWidth: 60 }} />}
            onClick={cancelEdit}
          />
        </>
      ) : (
        <Button
          style={{ padding: 0 }}
          type="link"
          disabled={isUpdating || isDeleting}
          onClick={() => startEdit(record)}
        >
          <EditOutlined />
        </Button>
      ),
  },
  {
    align: 'center',
    fixed: 'right',
    width: 100,
    render: (_, record) => (
      <Popconfirm
        title={`Видалити послугу "${record.name}"?`}
        onConfirm={() => remove(record._id)}
        cancelText="Відміна"
        disabled={isDeleting || isUpdating}
      >
        <DeleteOutlined style={{ color: 'red' }} />
      </Popconfirm>
    ),
  },
]
