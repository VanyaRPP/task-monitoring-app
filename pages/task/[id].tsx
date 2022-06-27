import s from './style.module.scss'
import { DeleteOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons'
import { Avatar, Card, Skeleton } from 'antd'
import { useRouter } from 'next/router'
import { useGetAllTaskQuery } from '../../api/taskApi/task.api'

const Task: React.FC = () => {

    const router = useRouter()

    const { data } = useGetAllTaskQuery('')

    const tasks = data?.data

    return (
        <div className={s.TaskContainer}>
            <Card
              className={s.Task}
              actions={[
              <EditOutlined key="edit" />,
              <DeleteOutlined key="ellipsis" />,
              ]}
            >
              <Skeleton loading={true} avatar active>
              <Card.Meta
                avatar={<Avatar src="https://joeschmoe.io/api/v1/random" />}
                title="Card title"
                description="This is the description"
               />
              </Skeleton>
            </Card>
        </div>
    )
}

export default Task

// _id: ObjectId;
// name: string;
// creator: ObjectId;
// desription?: string;
// domain?: string;
// category?: any;
// dateofcreate: Date;
// deadline: Date;