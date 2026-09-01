'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import AddPaymentModal from '@components/AddPaymentModal'
import ScrollFactoryAnimation from '@components/ScrollFactoryAnimation'
import { Header } from '@components/Layouts/Header'
import { Footer } from '@components/Layouts/Footer'
import DashboardTour from '@components/DashboardPage/DashboardTour'
import { addButton, removeButton } from '@modules/store/floatButtonSlice'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useRouter } from 'next/router'
import s from './DashboardLanding.module.scss'

const DashboardLanding = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const { data: user } = useGetCurrentUserQuery()
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [showTour, setShowTour] = useState(false)

  const tourFloatButton = useMemo(
    () => ({
      key: 'dashboard-tour',
      icon: <QuestionCircleOutlined />,
      onClick: () => setShowTour(true),
      tooltip: 'Тур',
      order: 5,
    }),
    []
  )

  useEffect(() => {
    dispatch(addButton(tourFloatButton))
    return () => {
      dispatch(removeButton(tourFloatButton.key))
    }
  }, [dispatch, tourFloatButton])

  const handleStartFirstInvoice = () => {
    setPaymentModalOpen(true)
  }

  const handlePaymentModalClose = (success?: boolean) => {
    setPaymentModalOpen(false)
    if (success) {
      router.push('/payment')
    } else {
      router.reload()
    }
    // The first invoice creates a provider+company on the fly, which promotes
    // the user to DomainAdmin. Reload so the new role and data take effect.
    router.reload()
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
            <ScrollFactoryAnimation
              action={
                <Button
                  type="primary"
                  size="large"
                  onClick={handleStartFirstInvoice}
                  style={{
                    marginTop: 24,
                    height: 56,
                    padding: '0 40px',
                    fontSize: 18,
                    fontWeight: 600,
                    borderRadius: 12,
                  }}
                >
                  Створити рахунок
                </Button>
              }
            />
          </div>
        </div>
      </section>

      <div style={{ position: 'sticky', bottom: 0, zIndex: 10, width: '100%' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <Footer style={{ borderTop: '1px solid rgba(118, 12, 206, 0.1)' }} />
        </div>
      </div>
      {paymentModalOpen && (
        <AddPaymentModal
          paymentActions={{ edit: false, preview: false }}
          closeModal={handlePaymentModalClose}
        />
      )}

      <DashboardTour userRoles={user?.roles || []} />
      <DashboardTour
        isVisible={showTour}
        onClose={() => setShowTour(false)}
        isManualStart
        userRoles={user?.roles || []}
      />
    </div>
  )
}

export default DashboardLanding
