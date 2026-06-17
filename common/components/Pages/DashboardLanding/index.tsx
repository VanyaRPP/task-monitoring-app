'use client'

import React, { useEffect, useState } from 'react'
import { Modal, Button, Typography, Space } from 'antd'
import AddPaymentModal from '@components/AddPaymentModal'
import ScrollFactoryAnimation from '@components/ScrollFactoryAnimation'
import { Header } from '@components/Layouts/Header'
import { Footer } from '@components/Layouts/Footer'
import {
  useGetCurrentUserQuery,
  useGetUserByIdQuery,
  userApi,
} from '@common/api/userApi/user.api'
import { useAppDispatch } from '@modules/store/hooks'
import { Roles } from '@utils/constants'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import DomainModal from '@components/UI/DomainsComponents/DomainModal'
import s from './DashboardLanding.module.scss'

const { Title, Text } = Typography

const DashboardLanding = () => {
  const dispatch = useAppDispatch()
  const { data: user } = useGetCurrentUserQuery()
  // The by-id endpoint returns adminDomains/adminCompanies, which lets us
  // decide modal visibility from what the user owns (data-driven) instead of a
  // one-shot isFirstLogin flag.
  const { data: fullUser } = useGetUserByIdQuery(user?._id as string, {
    skip: !user?._id,
  })
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [domainModalOpen, setDomainModalOpen] = useState(false)
  const [invoicePromptOpen, setInvoicePromptOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [createdDomainId, setCreatedDomainId] = useState<string>()

  useEffect(() => {
    if (!fullUser) return
    const isGlobalAdmin = user?.roles?.includes(Roles.GLOBAL_ADMIN)
    const scoped = fullUser as typeof fullUser & {
      adminDomains?: unknown[]
      adminCompanies?: unknown[]
    }
    const ownsNothing =
      !scoped.adminDomains?.length && !scoped.adminCompanies?.length
    setWelcomeOpen(Boolean(ownsNothing && !isGlobalAdmin))
  }, [fullUser, user])

  const handleCreateProvider = () => {
    setWelcomeOpen(false)
    setDomainModalOpen(true)
  }

  const handleDomainModalClose = (createdDomain?: IExtendedDomain) => {
    setDomainModalOpen(false)
    // Creating a domain adds the user to its adminEmails, which promotes them
    // to DomainAdmin on the next getCurrentUser call. Refresh the user so the
    // new role (and the data-driven modal visibility) updates without a reload.
    dispatch(userApi.util.invalidateTags(['User']))
    if (createdDomain?._id) {
      setCreatedDomainId(createdDomain._id)
      setInvoicePromptOpen(true)
    }
  }

  const handleStartFirstInvoice = () => {
    setInvoicePromptOpen(false)
    setPaymentModalOpen(true)
  }

  const handlePaymentModalClose = () => {
    setPaymentModalOpen(false)
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
        open={welcomeOpen}
        footer={null}
        onCancel={() => setWelcomeOpen(false)}
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

          <Button
            type="primary"
            block
            size="large"
            onClick={handleCreateProvider}
          >
            Створити надавача послуг
          </Button>
        </Space>
      </Modal>

      {domainModalOpen && (
        <DomainModal
          currentDomain={null as unknown as IExtendedDomain}
          editable
          closeModal={handleDomainModalClose}
        />
      )}

      <Modal
        open={invoicePromptOpen}
        centered
        width={420}
        onCancel={() => setInvoicePromptOpen(false)}
        footer={[
          <Button key="later" onClick={() => setInvoicePromptOpen(false)}>
            Пізніше
          </Button>,
          <Button key="yes" type="primary" onClick={handleStartFirstInvoice}>
            Так
          </Button>,
        ]}
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Title level={4} style={{ marginBottom: 0 }}>
            Надавача послуг створено!
          </Title>
          <Text type="secondary">Створити перший рахунок?</Text>
        </Space>
      </Modal>

      {paymentModalOpen && (
        <AddPaymentModal
          paymentActions={{ edit: false, preview: false }}
          preselectedDomain={createdDomainId}
          closeModal={handlePaymentModalClose}
        />
      )}
    </div>
  )
}

export default DashboardLanding
