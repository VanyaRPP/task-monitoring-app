'use client'

import React from 'react'
import ScrollFactoryAnimation from '@components/ScrollFactoryAnimation'
import { Header } from '@components/Layouts/Header'
import { Footer } from '@components/Layouts/Footer'
import s from './DashboardLanding.module.scss'

const DashboardLanding = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      margin: '-24px',
      position: 'relative',
    }}>

      <div style={{ position: 'sticky', top: 0, zIndex: 1000, width: '100%' }}>
        <Header 
          path={[{ title: 'Головна', path: '/' }]} 
          style={{ 
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(118, 12, 206, 0.1)'
          }} 
        />
      </div>

      <section className={s.section} style={{ flex: 1, position: 'relative', height: 'auto', overflow: 'visible' }}>
        <div className={s.bgLines} />
        <div className={s.blob} />

        <div className={s.panel} style={{ height: 'auto', overflow: 'visible' }}>
          <div className={s.grid} style={{ height: 'auto', overflow: 'visible', display: 'block' }}>
            
            <ScrollFactoryAnimation />

          </div>
        </div>
      </section>

      <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
        <Footer style={{borderTop: '1px solid rgba(118, 12, 206, 0.1)' }} />
      </div>

    </div>
  )
}

export default DashboardLanding