import { UserOutlined } from '@ant-design/icons'
import { AppRoutes } from '@utils/constants'
import {
  Avatar,
  Button,
  Card,
  Divider,
  Drawer,
  Image,
  Rate,
  Collapse,
  List,
  Empty,
} from 'antd'
import { signOut, useSession } from 'next-auth/react'
import Router from 'next/router'
import { useState } from 'react'
import { IUser } from '../../modules/models/User'
import Feedback from '../FeedbacksCard/feedback'
import s from './style.module.scss'

const UserLink: React.FC<{ user: IUser }> = ({ user }) => {
  const [visible, setVisible] = useState(false)
  // const [menuActive, setMenuActive] = useState(false)
  const { Panel } = Collapse
  const showDrawer = () => {
    setVisible(true)
  }

  const onClose = () => {
    setVisible(false)
  }

  if (user) {
    return (
      <>
        <a onClick={showDrawer}>{user?.name ?? user?.email}</a>
        <Drawer
          title={`Профіль користувача ${user?.name}`}
          placement="right"
          onClose={onClose}
          visible={visible}
        >
          <Card onClick={(e) => e.stopPropagation()} className={s.Card}>
            <Avatar
              size={150}
              icon={<UserOutlined />}
              src={
                <Image
                  src={user?.image || undefined}
                  preview={false}
                  alt="UserImg"
                />
              }
            />
            <h2>{user?.name}</h2>
            <Divider />
            <p>{user?.email}</p>
            <Divider />
            <Rate disabled value={user?.rating} />
            <Divider />
            <Collapse ghost accordion className={s.Accordion}>
              <Panel header="Відгуки" key="1">
                {user?.feedback?.length ? (
                  <List
                    className={s.List}
                    dataSource={user?.feedback}
                    renderItem={(item, index) => (
                      <List.Item key={index} className={s.ListItem}>
                        <Feedback feedback={item} />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty className={s.Empty} description="Немає даних" />
                )}
              </Panel>
            </Collapse>

            <Divider />
            <div className={s.Buttons}>
              <Button
                type="link"
                block
                onClick={() => Router.push(AppRoutes.PROFILE + '/' + user._id)}
              >
                Профіль користувача
              </Button>
            </div>
          </Card>
        </Drawer>
      </>
    )
  }
}

export default UserLink
