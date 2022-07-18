import { DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { Button, Popconfirm } from 'antd'

type PropsType = {
  onDelete: () => void
}

const DeleteButton: React.FC<PropsType> = ({ onDelete }) => {
  return (
    <Popconfirm
      title="Are you sure?"
      okText="Yes"
      cancelText="No"
      icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
      onConfirm={onDelete}
    >
      <Button type="primary">
        <DeleteOutlined />
      </Button>
    </Popconfirm>
  )
}

export default DeleteButton
