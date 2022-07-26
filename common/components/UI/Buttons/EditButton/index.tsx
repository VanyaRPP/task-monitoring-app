import { EditOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { Button, Popconfirm } from 'antd'

const EditButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <Popconfirm
      title="Are you sure?"
      okText="Yes"
      cancelText="No"
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
