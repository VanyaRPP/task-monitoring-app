import { DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { Button, Popconfirm } from 'antd'

interface Props {
  onDelete: () => void
}

const DeleteButton: React.FC<Props> = ({ onDelete }) => {
  return (
    <Popconfirm
      title="Ви впевнені?"
      okText="Так"
      cancelText="Ні"
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
