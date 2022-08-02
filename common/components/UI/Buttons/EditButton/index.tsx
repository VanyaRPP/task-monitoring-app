import { EditOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { Button, Popconfirm } from 'antd'

const EditButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <Popconfirm
      title="Ви впевнені?"
      okText="Так"
      cancelText="Ні"
      icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
      onConfirm={onClick}
    >
      <Button type="primary">
        <EditOutlined />
      </Button>
    </Popconfirm>
  )
}

export default EditButton
