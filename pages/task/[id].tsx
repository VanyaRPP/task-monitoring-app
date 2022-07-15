import { Avatar, Card, List, Tabs } from 'antd'
import { useRouter } from 'next/router'
import { AppRoutes } from '../../utils/constants'
import s from './style.module.scss'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { GetServerSideProps } from 'next'
import TaskCard from '../../common/components/TaskCard'
import config from '../../common/lib/task.config'
import { StarOutlined } from '@ant-design/icons'

const Task: React.FC = () => {
  const router = useRouter()

  return (
    <div className={s.TaskContainer}>
      <TaskCard taskId={router.query.id} />

      <Card className={`${s.Card} ${s.Auction}`} title="Auction">
        <ul>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
          <li>Master name</li>
        </ul>
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  )

  if (!session) {
    return {
      redirect: {
        destination: AppRoutes.AUTH_SIGN_IN,
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
