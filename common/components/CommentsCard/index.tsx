import { Card, List, Avatar } from 'antd'
import s from './style.module.scss'

import { comments } from 'common/lib/task.config'

interface Props {
  taskId: string | string[]
  loading?: boolean
}

const CommentsCard: React.FC<Props> = ({ taskId, loading = false }) => {
  return (
    <Card loading={loading} className={s.Card} title="Comments">
      {comments.length ? (
        <List
          className={s.List}
          dataSource={comments}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <List.Item.Meta
                avatar={<Avatar src={item.avatar} />}
                title={item.name}
                description={<p className={s.Description}>{item.comment}</p>}
              />
            </List.Item>
          )}
        />
      ) : (
        <h2 style={{ textAlign: 'center' }}>Nobody here</h2>
      )}
    </Card>
  )
}

export default CommentsCard
