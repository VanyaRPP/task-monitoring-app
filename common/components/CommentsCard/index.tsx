import { Card, List, Avatar } from 'antd'
import s from './style.module.scss'

import { comments } from 'common/lib/task.config'

interface Props {
  loading?: boolean
}

const CommentsCard: React.FC<Props> = ({ loading = false }) => {
  return (
    <Card loading={loading} className={s.Card} title="Коментарі">
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
        <h2 style={{ textAlign: 'center' }}>Коментарів ще немає</h2>
      )}
    </Card>
  )
}

export default CommentsCard
