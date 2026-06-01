'use client'

import React, { useEffect, useState } from 'react'
import { Modal, Button, Typography, Space } from 'antd'
import { useRouter } from 'next/router'
import ScrollFactoryAnimation from '@components/ScrollFactoryAnimation'
import { Header } from '@components/Layouts/Header'
import { Footer } from '@components/Layouts/Footer'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useUpdateUserMutation } from '@common/api/userApi/user.api'
import { Roles, AppRoutes } from '@utils/constants'
import s from './DashboardLanding.module.scss'

const { Title, Text } = Typography

const DashboardLanding = () => {
  const router = useRouter()
  const { data: user } = useGetCurrentUserQuery()
  const [updateUser] = useUpdateUserMutation()
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
  const isGlobalAdmin = user?.roles?.includes(Roles.GLOBAL_ADMIN)
  if (user && user.isFirstLogin && !isGlobalAdmin) {
    setModalOpen(true)
  }
}, [user])

  const handleChoice = async (isProvider: boolean) => {
    if (!user?._id) return

    await updateUser({
      _id: user._id,
      isFirstLogin: false,
      ...(isProvider && { roles: [Roles.DOMAIN_ADMIN] }),
    })

    setModalOpen(false)
    if (isProvider) {
      router.push(AppRoutes.DOMAIN)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        margin: '-24px',
        position: 'relative',
      }}
    >
      <div style={{ position: 'sticky', top: 0, zIndex: 1000, width: '100%' }}>
        <Header
          path={[{ title: 'Головна', path: '/' }]}
          style={{
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(118, 12, 206, 0.1)',
          }}
        />
      </div>

      <section
        className={s.section}
        style={{
          flex: 1,
          position: 'relative',
          height: 'auto',
          overflow: 'visible',
        }}
      >
        <div className={s.bgLines} />
        <div className={s.blob} />

        <div
          className={s.panel}
          style={{ height: 'auto', overflow: 'visible' }}
        >
          <div
            className={s.grid}
            style={{ height: 'auto', overflow: 'visible', display: 'block' }}
          >
            <ScrollFactoryAnimation />
          </div>
        </div>
      </section>

      <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
        <Footer style={{ borderTop: '1px solid rgba(118, 12, 206, 0.1)' }} />
      </div>

      <Modal
        open={modalOpen}
        footer={null}
        closable={false}
        centered
        width={480}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ marginBottom: 8 }}>
              Вітаю у додатку E-Orenda
            </Title>
            <Text type="secondary">
              де ви можете робити рахунки в один клік
            </Text>
          </div>

          <Text strong style={{ display: 'block', textAlign: 'center' }}>
            Ким ви будете?
          </Text>

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Button
              type="primary"
              block
              size="large"
              onClick={() => handleChoice(true)}
            >
              Надавач послуг
            </Button>
            <Button
              block
              size="large"
              onClick={() => handleChoice(false)}
            >
              Споживач
            </Button>
          </Space>
        </Space>
      </Modal>
    </div>
  )
}

export default DashboardLanding
