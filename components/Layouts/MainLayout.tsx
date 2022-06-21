import { Layout } from 'antd'
import MainFooter from '../Footer'
import MainHeader from '../Header'
import s from './MainLayout.style.module.scss'

const { Footer, Content } = Layout;

interface Props {
  children: React.ReactNode;
}

const MainLayout: React.FC<Props> = ({ children }) => {

  return (
    <>
      <Layout className={s.Layout}>
        <MainHeader />
        <Layout>
          <Content className={s.Container}>
            <div className={s.Background}>
              {children}
            </div>
          </Content>
          {/* {
            user ?
              <Sider
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
              </Sider> : null
          } */}
        </Layout>
        <MainFooter />
      </Layout >
    </>
  )
}

export default MainLayout