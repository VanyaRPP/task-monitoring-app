import {
  Tabs,
  Button,
  Col,
  Row,
  Statistic,
  Comment,
  Avatar,
  Tooltip,
} from 'antd'
import moment from 'moment'
import Categories from '../../components/Categories'

const AdminPage: React.FC = () => {
  const { TabPane } = Tabs

  return (
    <>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Statistics" key="1">
          <Row gutter={16}>
            <Col span={12}>
              <Statistic title="Active Users" value={1128} />
              <Statistic title="Active Workers" value={893} />
            </Col>
            <Col span={12}>
              <Statistic title="Tasks in process" value={893} />
              <Statistic title="Open tasks" value={93} />
            </Col>
          </Row>
        </TabPane>
        <TabPane tab="Categories" key="2">
          <Categories />
        </TabPane>
        <TabPane tab="Сomplaints" key="3">
          <Comment
            author={<a>Han Solo</a>}
            avatar={
              <Avatar src="https://joeschmoe.io/api/v1/random" alt="Han Solo" />
            }
            content={
              <p>
                Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                Voluptatem similique animi aspernatur illo quasi ullam odit.
                Consequuntur quae at assumenda?
              </p>
            }
            datetime={
              <Tooltip title={moment().format('YYYY-MM-DD HH:mm:ss')}>
                <span>{moment().fromNow()}</span>
              </Tooltip>
            }
          />
        </TabPane>
      </Tabs>
    </>
  )
}

export default AdminPage
