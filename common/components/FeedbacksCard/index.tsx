import { StarOutlined } from '@ant-design/icons'
import { Card, Empty, List } from 'antd'
import { IUser } from 'common/modules/models/User'
import Feedback from './feedback'
import s from './style.module.scss'

interface Props {
  user: IUser
  loading?: boolean
}

function CalculateAVG(feedback) {
  return feedback?.length > 0
    ? feedback.reduce((a, b) => a + b.grade, 0) / feedback.length
    : 0
}

const FeedbacksCard: React.FC<Props> = ({ user, loading = false }) => {
  return (
    <Card
      loading={loading}
      className={s.Card}
      title="Feedbacks"
      extra={
        <span>
          {`Rating: ${CalculateAVG(user?.feedback)} / 5 `}
          <StarOutlined />
        </span>
      }
    >
      {user?.feedback.length ? (
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
        <Empty className={s.Empty} />
      )}
    </Card>
  )
}

export default FeedbacksCard
