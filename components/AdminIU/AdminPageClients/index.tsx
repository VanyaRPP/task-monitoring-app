import { DeleteOutlined, EditOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Image, Tabs, Comment } from 'antd'
import Meta from 'antd/lib/card/Meta'
import { useGetAllUsersQuery } from '../../../api/userApi/user.api'
import { IUser } from '../../../models/User'

type PropsType = {
  clientInfo: IUser
}

const ClientInfo: React.FC<PropsType> = ({ clientInfo }) => {
  return (
    <Card
      actions={[
        <Button key="edit" ghost type="primary">
          <EditOutlined />
        </Button>,
        <Button key="delete" ghost type="primary">
          <DeleteOutlined />
        </Button>,
      ]}
    >
      <Meta
        avatar={
          <Avatar
            icon={<UserOutlined />}
            src={<Image src={clientInfo.image} alt={clientInfo.name} />}
          />
        }
        title={clientInfo.name}
        description={'Email: ' + clientInfo.email}
      />
    </Card>
  )
}

const AdminPageClients: React.FC = () => {
  const { TabPane } = Tabs

  const { data } = useGetAllUsersQuery('')
  const allClients = data?.data

  console.log(allClients)

  return (
    <Tabs type="card">
      <TabPane tab="Users" key="1">
        <Tabs type="card" tabPosition="left">
          {allClients &&
            allClients
              .filter((client) => client.role === 'User')
              .map((user) => (
                <TabPane tab={user.name || user.email} key={user._id}>
                  <ClientInfo clientInfo={user} />
                </TabPane>
              ))}
        </Tabs>
      </TabPane>
      <TabPane tab="Worker" key="2">
        <Tabs type="card" tabPosition="left">
          {allClients &&
            allClients
              .filter((client) => client.role === 'Worker')
              .map((worker) => (
                <TabPane tab={worker.name || worker.email} key={worker._id}>
                  <ClientInfo clientInfo={worker} />
                </TabPane>
              ))}
        </Tabs>
      </TabPane>
      <TabPane tab="Premium" key="3">
        Premium
      </TabPane>
    </Tabs>
  )
}

export default AdminPageClients
