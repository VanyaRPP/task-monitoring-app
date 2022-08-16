import { UserOutlined } from '@ant-design/icons'
import { useGetUserByIdQuery } from '@common/api/userApi/user.api'
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
import { IFeedback, IUser } from '../../modules/models/User'
import Feedback from '../FeedbacksCard/feedback'
import RateStars from '../UI/RateStars'
import s from './style.module.scss'

const UserLink: React.FC<{ user: IUser }> = ({ user }) => {
  const [visible, setVisible] = useState(false)
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
          width={'50%'}
          className={s.Drawer}
          bodyStyle={{ backgroundColor: 'var(--backgroundColor)' }}
          headerStyle={{
            backgroundColor: 'var(--backgroundColorPrimary)',
          }}
        >
          <Card onClick={(e) => e.stopPropagation()} className={s.Card}>
            <Avatar
              size={100}
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
            <p className={s.Email}>{user?.email}</p>
            <Divider />
            <Rate disabled value={user?.rating} />
            <Divider />
            <Collapse
              ghost
              accordion
              expandIconPosition="end"
              className={s.Accordion}
            >
              <Panel header="Відгуки" key="1" className={s.Panel}>
                {user?.feedback?.length ? (
                  <List
                    className={s.List}
                    dataSource={user?.feedback}
                    renderItem={(item, index) => (
                      <List.Item key={index} className={s.ListItem}>
                        <Avatar
                          icon={<UserOutlined />}
                          src={
                            <Image src={user?.image || undefined} alt="User" />
                          }
                        />
                        <h4>
                          {user ? <p>{user?.name}</p> : 'Замовника не знайдено'}
                        </h4>
                        <p>{item?.text}</p>
                        <RateStars
                          className={s.RateStar}
                          value={item?.grade}
                          disabled
                        />
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
