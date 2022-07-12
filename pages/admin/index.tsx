import { Tabs } from 'antd'
import AdminPageCategories from '../../components/AdminIU/AdminPageCategorie'
import AdminPageClients from '../../components/AdminIU/AdminPageClients'

const AdminPage: React.FC = () => {
  const { TabPane } = Tabs

  return (
    <>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Categories" key="1">
          <AdminPageCategories />
        </TabPane>
        <TabPane tab="Clients" key="2">
          <AdminPageClients />
        </TabPane>
        <TabPane tab="Domains" key="3">
          Domains
        </TabPane>
      </Tabs>
    </>
  )
}

export default AdminPage
