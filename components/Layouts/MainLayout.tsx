import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Layout } from 'antd'
import { useState } from 'react';
import MainFooter from '../Footer';
import MainHeader from '../Header';
import s from './MainLayout.style.module.sass'

const { Header, Footer, Sider, Content } = Layout;

interface Props {
  children: React.ReactNode;
}

const MainLayout: React.FC<Props> = ({ children }) => {

  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Layout className={s.Layout}>
        <MainHeader />
        <Layout>
          {/* <Sider
          theme='light'
          trigger={null}
          collapsible
          collapsed={collapsed}
          onCollapse={value => setCollapsed(value)}
          style={{ flexDirection: 'column' }}
        >
          <div
            className='trigger'
            onClick={() => setCollapsed(!collapsed)} 
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          Sider
        </Sider> */}
          <Content className={s.Container}>{children}</Content>
        </Layout>
        <Footer>
          <MainFooter />
        </Footer>
      </Layout >
    </>
  )
}

export default MainLayout