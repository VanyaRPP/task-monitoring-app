import {
  DeleteOutlined,
  EditOutlined,
  QuestionCircleOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Card, List, Popconfirm, Table, Tabs } from 'antd'
import Router, { useRouter } from 'next/router'
import {
  useDeleteTaskMutation,
  useGetTaskByIdQuery,
} from '../../api/taskApi/task.api'
import { useGetUserByIdQuery } from '../../api/userApi/user.api'
import { useSession } from 'next-auth/react'
import { ObjectId } from 'mongoose'
import { dateToDefaultFormat } from '../../components/features/formatDate'
import { AppRoutes } from '../../utils/constants'
import DeleteButton from '../../components/DeleteButton/index'
import s from './style.module.scss'

import config from '../../lib/task.config'

const Task: React.FC = () => {
  const { data: session } = useSession()
  const router = useRouter()

  const { data } = useGetTaskByIdQuery(`${router.query.id}`, {
    skip: !router.query.id,
  })
  const task = data?.data

  const { data: userData } = useGetUserByIdQuery(`${task?.creator}`, {
    skip: !task,
  })
  const user = userData?.data

  const [deleteTask] = useDeleteTaskMutation()

  const taskDelete = (id: ObjectId) => {
    deleteTask(id)
    Router.push(AppRoutes.TASK)
  }

  const Actions = [
    <Button key="edit" ghost type="primary">
      <EditOutlined />
    </Button>,
    <Popconfirm
      key="delete"
      title="Are you sure?"
      okText="Yes"
      cancelText="No"
      icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
      onConfirm={() => taskDelete(task?._id)}
    >
      <Button ghost type="primary">
        <DeleteOutlined />
      </Button>
    </Popconfirm>,
  ]

  return (
    <div className={s.TaskContainer}>
      <Card className={`${s.Card} ${s.Task}`}>
        <div className={s.UserInfo}>
          <Avatar size={200} src={user?.image} />
          <h2>{user?.name}</h2>
        </div>

        <Card
          className={s.TaskInfo}
          title={task?.name}
          actions={session?.user?.email === user?.email && Actions}
        >
          <p className={s.Description}>Description: {task?.desription}</p>
          <p>Category: {task?.category}</p>
          <p>Domain: {task?.domain}</p>
          <p>DeadLine: {dateToDefaultFormat(task?.deadline)}</p>
        </Card>
      </Card>

      <Card
        className={`${s.Card} ${s.Auction}`}
        title={`Auction: ${config.auction.data.length}`}
      >
        {config.auction.data.length ? (
          <Table
            dataSource={config.auction.data}
            columns={config.auction.columns}
          />
        ) : (
          <h2 style={{ textAlign: 'center' }}>Nobody</h2>
        )}
      </Card>

      <Card className={`${s.Card} ${s.Comments}`}>
        <Tabs defaultActiveKey="1" className={s.Tabs}>
          <Tabs.TabPane tab="Comments" key="1">
            <List
              className={s.List}
              dataSource={config.comments.data}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={item.avatar} />}
                    title={item.name}
                    description={
                      <p className={s.Description}>{item.comment}</p>
                    }
                  />
                </List.Item>
              )}
            ></List>
          </Tabs.TabPane>

          <Tabs.TabPane tab="Feedbacks" key="2">
            <List
              className={s.List}
              dataSource={config.feedbacks.data}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={item.avatar} />}
                    title={item.name}
                    description={
                      <p className={s.Description}>{item.feedback}</p>
                    }
                  />
                  <span>
                    {item.rate}/5
                    <StarOutlined />
                  </span>
                </List.Item>
              )}
            ></List>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default Task
