import { Card, Tabs, List, Avatar } from 'antd'
import { StarOutlined } from '@ant-design/icons'
import s from './style.module.scss'

import { comments, feedbacks } from 'common/lib/task.config'

const Comments = ({ taskId }) => {
  return (
    <Card className={`${s.Card} ${s.Comments}`}>
      <Tabs defaultActiveKey="1" className={s.Tabs}>
        <Tabs.TabPane tab="Comments" key="1">
          {comments.length ? (
            <List
              className={s.List}
              dataSource={comments}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    avatar={<Avatar src={item.avatar} />}
                    title={item.name}
                    description={
                      <p className={s.Description}>{item.comment}</p>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <h2 style={{ textAlign: 'center' }}>Nobody here</h2>
          )}
        </Tabs.TabPane>

        <Tabs.TabPane tab="Feedbacks" key="2">
          {feedbacks.length ? (
            <List
              className={s.List}
              dataSource={feedbacks}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    avatar={<Avatar src={item.avatar} />}
                    title={item.name}
                    description={
                      <p className={s.Description}>{item.feedback}</p>
                    }
                  />
                  <span>
                    {item.rate} / 5 <StarOutlined />
                  </span>
                </List.Item>
              )}
            />
          ) : (
            <h2 style={{ textAlign: 'center' }}>Nobody here</h2>
          )}
        </Tabs.TabPane>
      </Tabs>
    </Card>
  )
}

export default Comments
