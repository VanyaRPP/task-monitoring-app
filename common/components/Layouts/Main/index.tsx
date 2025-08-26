'use client'

import dynamic from 'next/dynamic'

const MainLayout = dynamic(() => import('./MainLayoutInner'), {
  ssr: false,
})

export default MainLayout
