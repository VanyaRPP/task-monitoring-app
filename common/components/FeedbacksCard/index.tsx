import { Card, List } from 'antd'
import { IUser } from 'common/modules/models/User'
import Feedback from './feedback'
import s from './style.module.scss'

interface Props {
  user: IUser
  loading?: boolean
}

const FeedbacksCard: React.FC<Props> = ({ user, loading = false }) => {
  return (
    <Card loading={loading} className={s.Card} title="Feedbacks">
      {user?.feedback ? (
        <List
          className={s.List}
          dataSource={user?.feedback}
          renderItem={(item, index) => (
            <List.Item key={index}>
              <Feedback feedback={item} />
            </List.Item>
          )}
        />
      ) : (
        <h2 style={{ textAlign: 'center' }}>Nobody here</h2>
      )}
    </Card>
  )
}

export default FeedbacksCard
